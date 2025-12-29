"use server";

import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { createAgreementSchema } from "@/lib/validations";
import { generatePublicSlug } from "@/lib/slug-utils";
import { enforcePlanLimits, incrementMonthlyUsage } from "@/lib/usage-utils";
import { logAuditEvent } from "@/lib/audit-utils";
import { AuditActor, AgreementStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";

export async function createAgreement(formData: FormData) {
  try {
    const user = await requireAuth();

    // Enforce plan limits
    await enforcePlanLimits(user.id);

    const rawData = {
      clientName: formData.get("clientName") as string | null,
      clientEmail: formData.get("clientEmail") as string | null,
      title: formData.get("title") as string,
      workIncluded: formData.get("workIncluded") as string,
      workExcluded: formData.get("workExcluded") as string,
      totalPrice: formData.get("totalPrice") as string,
      depositAmount: formData.get("depositAmount") as string,
      balanceDue: formData.get("balanceDue") as string,
      currency: formData.get("currency") as string || user.defaultCurrency || "GBP",
      expiresAt: formData.get("expiresAt") as string | null,
      paymentInstructions: formData.get("paymentInstructions") as string || user.defaultBankDetails || "",
      externalPaymentLink: (formData.get("externalPaymentLink") as string)?.trim() || null,
      cancellationTerms: formData.get("cancellationTerms") as string,
      governingCountry: formData.get("governingCountry") as string || user.country || "",
    };

    // Validate
    const validated = createAgreementSchema.parse({
      ...rawData,
      totalPrice: parseFloat(rawData.totalPrice) || 0,
      depositAmount: parseFloat(rawData.depositAmount) || 0,
      balanceDue: parseFloat(rawData.balanceDue) || 0,
      expiresAt: rawData.expiresAt ? rawData.expiresAt : undefined,
    });

    // Generate unguessable public slug
    const publicSlug = generatePublicSlug();

    // Create agreement
    const agreement = await prisma.agreement.create({
      data: {
        userId: user.id,
        publicSlug,
        clientName: validated.clientName || null,
        clientEmail: validated.clientEmail || null,
        title: validated.title,
        workIncluded: validated.workIncluded,
        workExcluded: validated.workExcluded,
        totalPrice: validated.totalPrice,
        depositAmount: validated.depositAmount,
        balanceDue: validated.balanceDue,
        currency: validated.currency,
        expiresAt: validated.expiresAt || null,
        paymentInstructions: validated.paymentInstructions,
        externalPaymentLink: validated.externalPaymentLink || null,
        cancellationTerms: validated.cancellationTerms,
        governingCountry: validated.governingCountry,
        status: "DRAFT",
      },
    });

    // Increment usage
    await incrementMonthlyUsage(user.id);

    // Log audit event
    await logAuditEvent(agreement.id, "CONTRACTOR", "CREATED", {
      title: agreement.title,
    });

    redirect(`/agreements/${agreement.id}`);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      return {
        success: false,
        error: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ") || "Validation error",
      };
    }
    if (error instanceof Error && error.message.includes("Plan limit")) {
      return {
        success: false,
        error: error.message,
      };
    }
    console.error("Create agreement error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Failed to create agreement: ${errorMessage}. Please try again.`,
    };
  }
}

export async function getAgreements(status?: AgreementStatus) {
  const user = await requireAuth();

  const where: { userId: string; status?: AgreementStatus } = {
    userId: user.id,
  };

  if (status) {
    where.status = status;
  }

  return prisma.agreement.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      publicSlug: true,
      title: true,
      clientName: true,
      totalPrice: true,
      currency: true,
      status: true,
      createdAt: true,
      expiresAt: true,
    },
  });
}

export async function getAgreementById(agreementId: string) {
  const user = await requireAuth();

  const agreement = await prisma.agreement.findFirst({
    where: {
      id: agreementId,
      userId: user.id,
    },
    include: {
      auditEvents: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return agreement;
}

export async function updateAgreementStatus(
  agreementId: string,
  newStatus: AgreementStatus
) {
  const user = await requireAuth();

  // Verify ownership
  const agreement = await prisma.agreement.findFirst({
    where: {
      id: agreementId,
      userId: user.id,
    },
  });

  if (!agreement) {
    return {
      success: false,
      error: "Agreement not found",
    };
  }

  // Import state machine function
  const { transitionAgreementStatus } = await import("@/lib/state-machine");

  return transitionAgreementStatus(
    agreementId,
    newStatus,
    "CONTRACTOR"
  );
}

