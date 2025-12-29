import PDFDocument from "pdfkit";
import { Agreement, AuditEvent, User } from "@prisma/client";

interface AgreementWithEvents extends Agreement {
  user: Pick<User, "businessName" | "country">;
  auditEvents: (AuditEvent & {
    metadata: Record<string, unknown> | null;
  })[];
}

const actorLabels: Record<string, string> = {
  CLIENT: "Client",
  CONTRACTOR: "Contractor",
  SYSTEM: "System",
};

const eventLabels: Record<string, string> = {
  CREATED: "Agreement Created",
  UPDATED: "Agreement Updated",
  SENT: "Agreement Sent",
  VIEWED: "Agreement Viewed",
  ACCEPTED: "Agreement Accepted",
  REJECTED: "Agreement Rejected",
  EXPIRED: "Agreement Expired",
  DEPOSIT_SENT: "Deposit Sent",
  DEPOSIT_RECEIVED: "Deposit Received",
  IN_PROGRESS: "Work Started",
  COMPLETED: "Agreement Completed",
  CANCELLED: "Agreement Cancelled",
  CORRECTION: "Correction Added",
  STATUS_REVERTED: "Status Reverted",
};

/**
 * Generate PDF for an agreement
 */
export async function generateAgreementPDF(
  agreement: AgreementWithEvents
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const buffers: Buffer[] = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on("error", reject);

      // Header
      doc.fontSize(20).font("Helvetica-Bold").text("QuoteLock Agreement", {
        align: "center",
      });
      doc.moveDown(0.5);
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(
          `Generated: ${new Date().toUTCString()}`,
          { align: "center" },
          { continued: false }
        );
      doc.moveDown(1);

      // Agreement Title
      doc.fontSize(16).font("Helvetica-Bold").text(agreement.title);
      doc.moveDown(0.5);

      // Business Name
      if (agreement.user.businessName) {
        doc.fontSize(12).font("Helvetica").text(`Contractor: ${agreement.user.businessName}`);
        doc.moveDown(0.5);
      }

      // Status
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Status: ${agreement.status}`, { continued: false });
      doc.moveDown(0.5);

      // Client Info
      if (agreement.clientName) {
        doc.fontSize(12).font("Helvetica").text(`Client: ${agreement.clientName}`);
        if (agreement.clientEmail) {
          doc.fontSize(10).text(`Email: ${agreement.clientEmail}`);
        }
        doc.moveDown(0.5);
      }

      // Pricing Section
      doc.fontSize(14).font("Helvetica-Bold").text("Pricing");
      doc.moveDown(0.3);
      doc.fontSize(11).font("Helvetica");
      doc.text(
        `Total Price: ${formatCurrency(Number(agreement.totalPrice), agreement.currency)}`
      );
      doc.text(
        `Deposit Amount: ${formatCurrency(Number(agreement.depositAmount), agreement.currency)}`
      );
      doc.text(
        `Balance Due: ${formatCurrency(Number(agreement.balanceDue), agreement.currency)}`
      );
      doc.text(`Currency: ${agreement.currency}`);
      doc.moveDown(0.5);

      // Dates
      if (agreement.expiresAt) {
        doc.text(`Expires At: ${new Date(agreement.expiresAt).toUTCString()}`);
        doc.moveDown(0.5);
      }
      doc.text(`Governing Country: ${agreement.governingCountry}`);
      doc.moveDown(1);

      // Work Included
      doc.fontSize(14).font("Helvetica-Bold").text("Work Included");
      doc.moveDown(0.3);
      doc.fontSize(11).font("Helvetica");
      doc.text(agreement.workIncluded, {
        align: "left",
        width: 500,
      });
      doc.moveDown(0.5);

      // Work Excluded
      doc.fontSize(14).font("Helvetica-Bold").text("Work Excluded");
      doc.moveDown(0.3);
      doc.fontSize(11).font("Helvetica");
      doc.text(agreement.workExcluded, {
        align: "left",
        width: 500,
      });
      doc.moveDown(0.5);

      // Payment Instructions
      doc.fontSize(14).font("Helvetica-Bold").text("Payment Instructions");
      doc.moveDown(0.3);
      doc.fontSize(11).font("Helvetica");
      doc.text(agreement.paymentInstructions, {
        align: "left",
        width: 500,
      });
      doc.moveDown(0.5);

      // External Payment Link
      if (agreement.externalPaymentLink) {
        doc.fontSize(11).font("Helvetica");
        doc.text(`External Payment Link: ${agreement.externalPaymentLink}`);
        doc.moveDown(0.5);
      }

      // Cancellation Terms
      doc.fontSize(14).font("Helvetica-Bold").text("Cancellation Terms");
      doc.moveDown(0.3);
      doc.fontSize(11).font("Helvetica");
      doc.text(agreement.cancellationTerms, {
        align: "left",
        width: 500,
      });
      doc.moveDown(1);

      // Acceptance and Deposit Confirmations
      const acceptedEvent = agreement.auditEvents.find(
        (e) => e.type === "ACCEPTED"
      );
      const depositSentEvent = agreement.auditEvents.find(
        (e) => e.type === "DEPOSIT_SENT"
      );
      const depositReceivedEvent = agreement.auditEvents.find(
        (e) => e.type === "DEPOSIT_RECEIVED"
      );

      if (acceptedEvent || depositSentEvent || depositReceivedEvent) {
        doc.fontSize(14).font("Helvetica-Bold").text("Confirmations");
        doc.moveDown(0.3);
        doc.fontSize(11).font("Helvetica");

        if (acceptedEvent) {
          doc.text("Agreement Accepted", { continued: false });
          doc.text(
            `Date: ${new Date(acceptedEvent.createdAt).toUTCString()}`,
            { indent: 20 }
          );
          if (acceptedEvent.metadata?.acknowledgedBy) {
            doc.text(
              `By: ${acceptedEvent.metadata.acknowledgedBy}`,
              { indent: 20 }
            );
          }
          if (acceptedEvent.ipAddress) {
            doc.text(`IP: ${acceptedEvent.ipAddress}`, { indent: 20 });
          }
          doc.moveDown(0.3);
        }

        if (depositSentEvent) {
          doc.text("Deposit Sent Confirmed", { continued: false });
          doc.text(
            `Date: ${new Date(depositSentEvent.createdAt).toUTCString()}`,
            { indent: 20 }
          );
          if (depositSentEvent.metadata?.transactionReference) {
            doc.text(
              `Reference: ${depositSentEvent.metadata.transactionReference}`,
              { indent: 20 }
            );
          }
          if (depositSentEvent.ipAddress) {
            doc.text(`IP: ${depositSentEvent.ipAddress}`, { indent: 20 });
          }
          doc.moveDown(0.3);
        }

        if (depositReceivedEvent) {
          doc.text("Deposit Received Confirmed", { continued: false });
          doc.text(
            `Date: ${new Date(depositReceivedEvent.createdAt).toUTCString()}`,
            { indent: 20 }
          );
          if (depositReceivedEvent.metadata?.transactionReference) {
            doc.text(
              `Reference: ${depositReceivedEvent.metadata.transactionReference}`,
              { indent: 20 }
            );
          }
          if (depositReceivedEvent.ipAddress) {
            doc.text(`IP: ${depositReceivedEvent.ipAddress}`, { indent: 20 });
          }
          doc.moveDown(0.3);
        }

        doc.moveDown(0.5);
      }

      // Audit Timeline
      if (agreement.auditEvents.length > 0) {
        doc.addPage();
        doc.fontSize(14).font("Helvetica-Bold").text("Audit Timeline");
        doc.moveDown(0.5);

        agreement.auditEvents.forEach((event, index) => {
          const isCorrection = event.type === "CORRECTION";

          if (index > 0) {
            doc.moveDown(0.3);
          }

          // Event header
          doc.fontSize(11).font("Helvetica-Bold");
          if (isCorrection) {
            doc.text(`⚠️ ${eventLabels[event.type] || event.type} (CORRECTION)`, {
              continued: false,
            });
          } else {
            doc.text(eventLabels[event.type] || event.type, { continued: false });
          }

          // Event details
          doc.fontSize(9).font("Helvetica");
          doc.text(
            `Date: ${new Date(event.createdAt).toUTCString()}`,
            { indent: 20 }
          );
          doc.text(`Actor: ${actorLabels[event.actor] || event.actor}`, {
            indent: 20,
          });
          if (event.ipAddress) {
            doc.text(`IP Address: ${event.ipAddress}`, { indent: 20 });
          }

          // Metadata
          if (event.metadata && Object.keys(event.metadata).length > 0) {
            doc.moveDown(0.2);
            doc.fontSize(8).font("Helvetica-Oblique");
            Object.entries(event.metadata).forEach(([key, value]) => {
              const valueStr =
                typeof value === "object"
                  ? JSON.stringify(value)
                  : String(value);
              doc.text(`${key}: ${valueStr}`, { indent: 30 });
            });
          }

          // Correction details
          if (isCorrection && event.metadata) {
            doc.moveDown(0.2);
            doc.fontSize(9).font("Helvetica-Bold");
            if (event.metadata.description) {
              doc.text(`Description: ${event.metadata.description}`, {
                indent: 30,
              });
            }
            if (event.metadata.affectedFields) {
              const fields = Array.isArray(event.metadata.affectedFields)
                ? event.metadata.affectedFields.join(", ")
                : String(event.metadata.affectedFields);
              doc.text(`Affected Fields: ${fields}`, { indent: 30 });
            }
          }

          // Check if we need a new page
          if (doc.y > 700) {
            doc.addPage();
          }
        });
      }

      // Footer Disclaimer
      doc.addPage();
      doc.moveDown(2);
      doc.fontSize(10).font("Helvetica-Bold").text("Disclaimer", {
        align: "center",
      });
      doc.moveDown(0.5);
      doc.fontSize(9).font("Helvetica").text(
        "QuoteLock records acknowledgements only and does not verify payments or performance.",
        {
          align: "center",
          width: 500,
        }
      );
      doc.moveDown(0.3);
      doc.fontSize(8).font("Helvetica").text(
        "QuoteLock is a record-keeping service only. We do NOT process payments, verify payments, hold funds, escrow funds, arbitrate disputes, or provide legal/tax advice.",
        {
          align: "center",
          width: 500,
        }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

