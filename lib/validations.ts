import { z } from "zod";

/**
 * Schema for creating a new agreement
 */
export const createAgreementSchema = z.object({
  clientName: z.string().min(1, "Client name is required").max(255).optional(),
  clientEmail: z.string().email("Invalid email address").optional(),
  title: z.string().min(1, "Title is required").max(255),
  workIncluded: z.string().min(1, "Work included is required"),
  workExcluded: z.string().min(1, "Work excluded is required"),
  totalPrice: z
    .number()
    .positive("Total price must be positive")
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format").transform(Number)),
  depositAmount: z
    .number()
    .nonnegative("Deposit amount cannot be negative")
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid deposit format").transform(Number)),
  balanceDue: z
    .number()
    .nonnegative("Balance due cannot be negative")
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid balance format").transform(Number)),
  currency: z.string().length(3, "Currency must be 3 characters (e.g., GBP)").default("GBP"),
  expiresAt: z
    .union([
      z.string().transform((val) => {
        // Handle datetime-local format (YYYY-MM-DDTHH:mm) or ISO string
        if (!val) return undefined;
        const date = new Date(val);
        return isNaN(date.getTime()) ? undefined : date;
      }),
      z.date(),
      z.undefined(),
    ])
    .optional(),
  paymentInstructions: z.string().min(1, "Payment instructions are required"),
  externalPaymentLink: z
    .union([z.string().url("Invalid URL format"), z.literal("")])
    .optional()
    .transform((val) => (val && val.trim() !== "" ? val : undefined)),
  cancellationTerms: z.string().min(1, "Cancellation terms are required"),
  governingCountry: z.string().min(1, "Governing country is required").max(100),
}).refine(
  (data) => {
    // Ensure depositAmount + balanceDue equals totalPrice (with small tolerance for floating point)
    const total = Number(data.depositAmount) + Number(data.balanceDue);
    const price = Number(data.totalPrice);
    return Math.abs(total - price) < 0.01;
  },
  {
    message: "Deposit amount + balance due must equal total price",
    path: ["balanceDue"],
  }
);

export type CreateAgreementInput = z.infer<typeof createAgreementSchema>;

/**
 * Schema for accepting an agreement (client acknowledgment)
 */
export const acceptAgreementSchema = z.object({
  agreementId: z.string().min(1, "Agreement ID is required"),
  acknowledgedBy: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email address").optional(),
});

export type AcceptAgreementInput = z.infer<typeof acceptAgreementSchema>;

/**
 * Schema for recording deposit sent (by client)
 */
export const depositSentSchema = z.object({
  agreementId: z.string().min(1, "Agreement ID is required"),
  amount: z
    .number()
    .positive("Amount must be positive")
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format").transform(Number)),
  sentAt: z
    .string()
    .datetime("Invalid date format")
    .transform((val) => new Date(val))
    .or(z.date()),
  transactionReference: z.string().max(255).optional(),
  notes: z.string().max(1000).optional(),
});

export type DepositSentInput = z.infer<typeof depositSentSchema>;

/**
 * Schema for recording deposit received (by contractor)
 */
export const depositReceivedSchema = z.object({
  agreementId: z.string().min(1, "Agreement ID is required"),
  amount: z
    .number()
    .positive("Amount must be positive")
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format").transform(Number)),
  receivedAt: z
    .string()
    .datetime("Invalid date format")
    .transform((val) => new Date(val))
    .or(z.date()),
  transactionReference: z.string().max(255).optional(),
  notes: z.string().max(1000).optional(),
});

export type DepositReceivedInput = z.infer<typeof depositReceivedSchema>;

/**
 * Schema for corrections/amendments to an agreement
 * Note: This records the correction in the audit trail but doesn't modify the original agreement
 */
export const correctionSchema = z.object({
  agreementId: z.string().min(1, "Agreement ID is required"),
  correctionType: z.enum([
    "PRICE_ADJUSTMENT",
    "SCOPE_CHANGE",
    "TERM_CHANGE",
    "DATE_CHANGE",
    "OTHER",
  ]),
  description: z.string().min(1, "Description is required").max(2000),
  affectedFields: z.array(z.string()).optional(),
  newValues: z.record(z.unknown()).optional(),
});

export type CorrectionInput = z.infer<typeof correctionSchema>;

