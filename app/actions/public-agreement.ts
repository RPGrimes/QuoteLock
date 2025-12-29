"use server";

import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit-utils";
import { checkRateLimit } from "@/lib/rate-limit";
import { transitionAgreementStatus } from "@/lib/state-machine";
import { AgreementStatus, AuditActor } from "@prisma/client";
import { headers } from "next/headers";
import { z } from "zod";

const acceptAgreementSchema = z.object({
  publicSlug: z.string().min(1),
  acknowledgedBy: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email address").optional(),
});

const confirmDepositSchema = z.object({
  publicSlug: z.string().min(1),
  transactionReference: z.string().max(255).optional(),
});

/**
 * Accept an agreement (client action)
 */
export async function acceptAgreement(formData: FormData) {
  try {
    // Rate limiting
    const rateLimit = await checkRateLimit("accept");
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: "Too many requests. Please try again later.",
      };
    }

    const rawData = {
      publicSlug: formData.get("publicSlug") as string,
      acknowledgedBy: formData.get("acknowledgedBy") as string,
      email: formData.get("email") as string | null,
    };

    const validated = acceptAgreementSchema.parse(rawData);

    // Get agreement
    const agreement = await prisma.agreement.findUnique({
      where: { publicSlug: validated.publicSlug },
    });

    if (!agreement) {
      return {
        success: false,
        error: "Agreement not found",
      };
    }

    // Security checks
    if (agreement.status === "CANCELLED") {
      return {
        success: false,
        error: "This agreement has been cancelled",
      };
    }

    if (agreement.status === "COMPLETED") {
      return {
        success: false,
        error: "This agreement has already been completed",
      };
    }

    if (agreement.expiresAt && new Date(agreement.expiresAt) < new Date()) {
      return {
        success: false,
        error: "This agreement has expired",
      };
    }

    if (agreement.status !== "SENT") {
      return {
        success: false,
        error: `Agreement cannot be accepted. Current status: ${agreement.status}`,
      };
    }

    // Get request context
    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      null;
    const userAgent = headersList.get("user-agent") ?? null;

    // Transition to ACCEPTED
    const result = await transitionAgreementStatus(
      agreement.id,
      "ACCEPTED",
      "CLIENT",
      {
        acknowledgedBy: validated.acknowledgedBy,
        email: validated.email,
      }
    );

    if (!result.success) {
      return result;
    }

    // Log audit event with IP and user agent
    await logAuditEvent(
      agreement.id,
      "CLIENT",
      "ACCEPTED",
      {
        acknowledgedBy: validated.acknowledgedBy,
        email: validated.email,
      },
      { ipAddress, userAgent }
    );

    // Update client info if provided
    if (validated.acknowledgedBy || validated.email) {
      await prisma.agreement.update({
        where: { id: agreement.id },
        data: {
          clientName: validated.acknowledgedBy || agreement.clientName,
          clientEmail: validated.email || agreement.clientEmail,
        },
      });
    }

    return {
      success: true,
      message: "Agreement accepted successfully",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation error",
      };
    }
    console.error("Accept agreement error:", error);
    return {
      success: false,
      error: "Failed to accept agreement. Please try again.",
    };
  }
}

/**
 * Confirm deposit sent (client action)
 */
export async function confirmDepositSent(formData: FormData) {
  try {
    // Rate limiting
    const rateLimit = await checkRateLimit("deposit");
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: "Too many requests. Please try again later.",
      };
    }

    const rawData = {
      publicSlug: formData.get("publicSlug") as string,
      transactionReference: formData.get("transactionReference") as string | null,
    };

    const validated = confirmDepositSchema.parse(rawData);

    // Get agreement
    const agreement = await prisma.agreement.findUnique({
      where: { publicSlug: validated.publicSlug },
    });

    if (!agreement) {
      return {
        success: false,
        error: "Agreement not found",
      };
    }

    // Security checks
    if (agreement.status === "CANCELLED") {
      return {
        success: false,
        error: "This agreement has been cancelled",
      };
    }

    if (agreement.status === "COMPLETED") {
      return {
        success: false,
        error: "This agreement has already been completed",
      };
    }

    if (agreement.expiresAt && new Date(agreement.expiresAt) < new Date()) {
      return {
        success: false,
        error: "This agreement has expired",
      };
    }

    if (agreement.status !== "ACCEPTED") {
      return {
        success: false,
        error: `Deposit cannot be confirmed. Current status: ${agreement.status}. Agreement must be accepted first.`,
      };
    }

    // Get request context
    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      null;
    const userAgent = headersList.get("user-agent") ?? null;

    // Transition to DEPOSIT_SENT
    const result = await transitionAgreementStatus(
      agreement.id,
      "DEPOSIT_SENT",
      "CLIENT",
      {
        transactionReference: validated.transactionReference,
      }
    );

    if (!result.success) {
      return result;
    }

    // Log audit event with IP and user agent
    await logAuditEvent(
      agreement.id,
      "CLIENT",
      "DEPOSIT_SENT",
      {
        transactionReference: validated.transactionReference,
        amount: Number(agreement.depositAmount),
      },
      { ipAddress, userAgent }
    );

    return {
      success: true,
      message: "Deposit confirmation recorded",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation error",
      };
    }
    console.error("Confirm deposit error:", error);
    return {
      success: false,
      error: "Failed to confirm deposit. Please try again.",
    };
  }
}

