import { AgreementStatus, AuditEventType, AuditActor } from "@prisma/client";
import { prisma } from "./prisma";
import { logAuditEvent } from "./audit-utils";

/**
 * Valid state transitions for agreements
 * Maps from current status to allowed next statuses
 */
const VALID_TRANSITIONS: Record<AgreementStatus, AgreementStatus[]> = {
  DRAFT: ["SENT", "CANCELLED"],
  SENT: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["DEPOSIT_SENT", "CANCELLED"],
  DEPOSIT_SENT: ["DEPOSIT_RECEIVED", "CANCELLED"],
  DEPOSIT_RECEIVED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [], // Terminal state - no transitions allowed
  CANCELLED: [], // Terminal state - no transitions allowed
};

/**
 * Commercial fields that become locked when agreement is ACCEPTED
 */
const LOCKED_COMMERCIAL_FIELDS = [
  "totalPrice",
  "depositAmount",
  "balanceDue",
  "currency",
  "workIncluded",
  "workExcluded",
] as const;

type LockedCommercialField = (typeof LOCKED_COMMERCIAL_FIELDS)[number];

/**
 * Check if a state transition is valid
 */
export function isValidTransition(
  from: AgreementStatus,
  to: AgreementStatus
): boolean {
  // CANCELLED can be reached from any state except COMPLETED
  if (to === "CANCELLED" && from !== "COMPLETED") {
    return true;
  }

  // Check if transition is in the allowed list
  const allowed = VALID_TRANSITIONS[from];
  return allowed.includes(to);
}

/**
 * Get allowed next statuses for a given current status
 */
export function getAllowedTransitions(
  currentStatus: AgreementStatus
): AgreementStatus[] {
  const allowed = VALID_TRANSITIONS[currentStatus];
  
  // Add CANCELLED if not already included and not COMPLETED
  if (currentStatus !== "COMPLETED" && !allowed.includes("CANCELLED")) {
    return [...allowed, "CANCELLED"];
  }
  
  return allowed;
}

/**
 * Transition agreement to a new status with full validation
 * This is the main function to use for all status changes
 */
export async function transitionAgreementStatus(
  agreementId: string,
  newStatus: AgreementStatus,
  actor: AuditActor,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  // Get current agreement
  const agreement = await prisma.agreement.findUnique({
    where: { id: agreementId },
  });

  if (!agreement) {
    return { success: false, error: "Agreement not found" };
  }

  // Check if transition is valid
  if (!isValidTransition(agreement.status, newStatus)) {
    const allowed = getAllowedTransitions(agreement.status);
    return {
      success: false,
      error: `Invalid status transition from ${agreement.status} to ${newStatus}. Allowed transitions: ${allowed.join(", ")}`,
    };
  }

  // Prepare update data
  const updateData: {
    status: AgreementStatus;
    lockedAt?: Date;
  } = {
    status: newStatus,
  };

  // Special handling for ACCEPTED status
  if (newStatus === "ACCEPTED" && agreement.status !== "ACCEPTED") {
    // Set lockedAt timestamp
    updateData.lockedAt = new Date();
  }

  // Perform the transition
  await prisma.agreement.update({
    where: { id: agreementId },
    data: updateData,
  });

  // Log audit event
  const eventType = getEventTypeForStatus(newStatus);
  await logAuditEvent(agreementId, actor, eventType, {
    fromStatus: agreement.status,
    toStatus: newStatus,
    ...metadata,
  });

  return { success: true };
}

/**
 * Map status to corresponding audit event type
 */
function getEventTypeForStatus(status: AgreementStatus): AuditEventType {
  const mapping: Record<AgreementStatus, AuditEventType> = {
    DRAFT: "CREATED",
    SENT: "SENT",
    ACCEPTED: "ACCEPTED",
    DEPOSIT_SENT: "DEPOSIT_SENT",
    DEPOSIT_RECEIVED: "DEPOSIT_RECEIVED",
    IN_PROGRESS: "IN_PROGRESS",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
  };
  return mapping[status];
}

/**
 * Check if commercial fields are locked for an agreement
 */
export function areCommercialFieldsLocked(agreement: {
  status: AgreementStatus;
  lockedAt: Date | null;
}): boolean {
  return agreement.status !== "DRAFT" && agreement.lockedAt !== null;
}

/**
 * Validate that commercial fields are not being modified on a locked agreement
 */
export function validateCommercialFieldsNotLocked(
  agreement: {
    status: AgreementStatus;
    lockedAt: Date | null;
  },
  updateData: Partial<{
    totalPrice: unknown;
    depositAmount: unknown;
    balanceDue: unknown;
    currency: unknown;
    workIncluded: unknown;
    workExcluded: unknown;
  }>
): { valid: boolean; error?: string } {
  if (!areCommercialFieldsLocked(agreement)) {
    return { valid: true };
  }

  // Check if any locked field is being updated
  const lockedFieldsBeingUpdated: string[] = [];
  for (const field of LOCKED_COMMERCIAL_FIELDS) {
    if (field in updateData && updateData[field] !== undefined) {
      lockedFieldsBeingUpdated.push(field);
    }
  }

  if (lockedFieldsBeingUpdated.length > 0) {
    return {
      valid: false,
      error: `Cannot modify locked commercial fields: ${lockedFieldsBeingUpdated.join(", ")}. Agreement was locked when accepted.`,
    };
  }

  return { valid: true };
}

/**
 * Add a correction audit event
 * Corrections explain mistakes but do not erase history
 */
export async function addCorrection(
  agreementId: string,
  actor: AuditActor,
  correctionType: string,
  description: string,
  affectedFields?: string[],
  newValues?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  // Verify agreement exists
  const agreement = await prisma.agreement.findUnique({
    where: { id: agreementId },
    select: { id: true },
  });

  if (!agreement) {
    return { success: false, error: "Agreement not found" };
  }

  // Log correction as audit event
  await logAuditEvent(agreementId, actor, "CORRECTION", {
    correctionType,
    description,
    affectedFields,
    newValues,
  });

  return { success: true };
}

/**
 * Revert status if allowed
 * Only allows reverting if the transition is valid according to the state machine
 */
export async function revertStatus(
  agreementId: string,
  targetStatus: AgreementStatus,
  actor: AuditActor,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const agreement = await prisma.agreement.findUnique({
    where: { id: agreementId },
  });

  if (!agreement) {
    return { success: false, error: "Agreement not found" };
  }

  // Check if transition to target status is valid
  if (!isValidTransition(agreement.status, targetStatus)) {
    const allowed = getAllowedTransitions(agreement.status);
    return {
      success: false,
      error: `Cannot revert from ${agreement.status} to ${targetStatus}. Invalid transition. Allowed transitions: ${allowed.join(", ")}`,
    };
  }

  // Perform the revert
  await prisma.agreement.update({
    where: { id: agreementId },
    data: { status: targetStatus },
  });

  // Log the revert
  await logAuditEvent(agreementId, actor, "STATUS_REVERTED", {
    fromStatus: agreement.status,
    toStatus: targetStatus,
    reason,
  });

  return { success: true };
}

/**
 * Convenience functions for common transitions
 */

export async function sendAgreement(
  agreementId: string,
  actor: AuditActor
): Promise<{ success: boolean; error?: string }> {
  return transitionAgreementStatus(agreementId, "SENT", actor);
}

export async function acceptAgreement(
  agreementId: string,
  actor: AuditActor,
  acknowledgedBy?: string
): Promise<{ success: boolean; error?: string }> {
  return transitionAgreementStatus(agreementId, "ACCEPTED", actor, {
    acknowledgedBy,
  });
}

export async function markDepositSent(
  agreementId: string,
  actor: AuditActor,
  amount?: number,
  transactionReference?: string
): Promise<{ success: boolean; error?: string }> {
  return transitionAgreementStatus(agreementId, "DEPOSIT_SENT", actor, {
    amount,
    transactionReference,
  });
}

export async function markDepositReceived(
  agreementId: string,
  actor: AuditActor,
  amount?: number,
  transactionReference?: string
): Promise<{ success: boolean; error?: string }> {
  return transitionAgreementStatus(agreementId, "DEPOSIT_RECEIVED", actor, {
    amount,
    transactionReference,
  });
}

export async function startWork(
  agreementId: string,
  actor: AuditActor
): Promise<{ success: boolean; error?: string }> {
  return transitionAgreementStatus(agreementId, "IN_PROGRESS", actor);
}

export async function completeAgreement(
  agreementId: string,
  actor: AuditActor
): Promise<{ success: boolean; error?: string }> {
  return transitionAgreementStatus(agreementId, "COMPLETED", actor);
}

export async function cancelAgreement(
  agreementId: string,
  actor: AuditActor,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  return transitionAgreementStatus(agreementId, "CANCELLED", actor, { reason });
}

