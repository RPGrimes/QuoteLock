import { prisma } from "./prisma";
import { AuditActor, AuditEventType } from "@prisma/client";
import { headers } from "next/headers";

interface RequestContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Log an audit event (append-only)
 * This function enforces the immutable audit trail requirement
 */
export async function logAuditEvent(
  agreementId: string,
  actor: AuditActor,
  type: AuditEventType,
  metadata?: Record<string, unknown>,
  requestContext?: RequestContext
): Promise<void> {
  // Get request context from headers if not provided
  const headersList = await headers();
  const ipAddress =
    requestContext?.ipAddress ??
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    null;
  const userAgent =
    requestContext?.userAgent ?? headersList.get("user-agent") ?? null;

  // Verify agreement exists
  const agreement = await prisma.agreement.findUnique({
    where: { id: agreementId },
    select: { id: true },
  });

  if (!agreement) {
    throw new Error(`Agreement ${agreementId} not found`);
  }

  // Create audit event (append-only - no updates or deletes)
  await prisma.auditEvent.create({
    data: {
      agreementId,
      actor,
      type,
      ipAddress,
      userAgent,
      metadata: metadata ? (metadata as object) : null,
    },
  });
}

