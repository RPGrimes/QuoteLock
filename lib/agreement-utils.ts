import { prisma } from "./prisma";
import { validateCommercialFieldsNotLocked } from "./state-machine";
import { AuditActor } from "@prisma/client";
import { logAuditEvent } from "./audit-utils";

/**
 * Safely update an agreement, respecting locked commercial fields
 * Throws an error if trying to modify locked fields
 */
export async function updateAgreementSafely(
  agreementId: string,
  updateData: {
    clientName?: string;
    clientEmail?: string;
    title?: string;
    workIncluded?: string;
    workExcluded?: string;
    totalPrice?: unknown;
    depositAmount?: unknown;
    balanceDue?: unknown;
    currency?: string;
    expiresAt?: Date | null;
    paymentInstructions?: string;
    externalPaymentLink?: string | null;
    cancellationTerms?: string;
    governingCountry?: string;
  },
  actor: AuditActor
): Promise<{ success: boolean; error?: string }> {
  // Get current agreement
  const agreement = await prisma.agreement.findUnique({
    where: { id: agreementId },
    select: {
      id: true,
      status: true,
      lockedAt: true,
    },
  });

  if (!agreement) {
    return { success: false, error: "Agreement not found" };
  }

  // Validate that locked fields are not being modified
  const validation = validateCommercialFieldsNotLocked(agreement, updateData);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Perform the update
  await prisma.agreement.update({
    where: { id: agreementId },
    data: updateData,
  });

  // Log the update
  await logAuditEvent(agreementId, actor, "UPDATED", {
    updatedFields: Object.keys(updateData),
  });

  return { success: true };
}

/**
 * Get agreement with full details (for display)
 */
export async function getAgreement(agreementId: string) {
  return prisma.agreement.findUnique({
    where: { id: agreementId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          businessName: true,
          country: true,
        },
      },
      auditEvents: {
        orderBy: { createdAt: "asc" },
        take: 100, // Limit to most recent 100 events
      },
    },
  });
}

/**
 * Get agreement by public slug (for public viewing)
 */
export async function getAgreementBySlug(publicSlug: string) {
  return prisma.agreement.findUnique({
    where: { publicSlug },
    include: {
      user: {
        select: {
          id: true,
          businessName: true,
          country: true,
        },
      },
      auditEvents: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

