import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import StatusBadge from "@/components/status-badge";
import PublicAgreementActions from "./actions";
import AuditTimeline from "@/components/audit-timeline";
import DisclaimerFooter from "@/components/disclaimer-footer";
import PDFDownloadButton from "@/components/pdf-download-button";

export default async function PublicAgreementPage({
  params,
}: {
  params: { publicSlug: string };
}) {
  const agreement = await prisma.agreement.findUnique({
    where: { publicSlug: params.publicSlug },
    include: {
      user: {
        select: {
          businessName: true,
          country: true,
        },
      },
      auditEvents: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!agreement) {
    notFound();
  }

  // Check if expired
  const isExpired = agreement.expiresAt
    ? new Date(agreement.expiresAt) < new Date()
    : false;

  // Log view event
  try {
    const { logAuditEvent } = await import("@/lib/audit-utils");
    await logAuditEvent(agreement.id, "CLIENT", "VIEWED", {
      publicSlug: params.publicSlug,
    });
  } catch (error) {
    console.error("Failed to log view event:", error);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              {agreement.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={agreement.status} />
              {agreement.user.businessName && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  • {agreement.user.businessName}
                </span>
              )}
              {isExpired && (
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  • Expired
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Download PDF Button */}
          <div className="flex justify-end">
            <PDFDownloadButton
              publicSlug={agreement.publicSlug}
              label="Download PDF"
            />
          </div>

          {/* Agreement Details */}
          <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Agreement Details
            </h2>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Price
                </dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: agreement.currency,
                  }).format(Number(agreement.totalPrice))}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Deposit Amount
                </dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: agreement.currency,
                  }).format(Number(agreement.depositAmount))}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Balance Due
                </dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: agreement.currency,
                  }).format(Number(agreement.balanceDue))}
                </dd>
              </div>

              {agreement.expiresAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Expires At
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {new Date(agreement.expiresAt).toLocaleString()}
                    {isExpired && (
                      <span className="ml-2 text-red-600 dark:text-red-400">
                        (Expired)
                      </span>
                    )}
                  </dd>
                </div>
              )}

              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Governing Country
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {agreement.governingCountry}
                </dd>
              </div>
            </dl>

            <div className="mt-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Work Included
                </h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
                  {agreement.workIncluded}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Work Excluded
                </h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
                  {agreement.workExcluded}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Payment Instructions
                </h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
                  {agreement.paymentInstructions}
                </p>
              </div>

              {agreement.externalPaymentLink && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    External Payment Link
                  </h3>
                  <a
                    href={agreement.externalPaymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    {agreement.externalPaymentLink}
                  </a>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cancellation Terms
                </h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
                  {agreement.cancellationTerms}
                </p>
              </div>
            </div>
          </div>

          {/* Strong Disclaimer */}
          <div className="rounded-lg border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-4">
            <h3 className="mb-2 text-sm font-bold text-red-900 dark:text-red-200">
              ⚠️ IMPORTANT DISCLAIMER
            </h3>
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>QuoteLock is a record-keeping service only.</strong> We do
              NOT process payments, verify payments, hold funds, escrow funds,
              arbitrate disputes, or provide legal/tax advice. QuoteLock only
              records acknowledgements and timestamps in an immutable audit trail.
              All payments are handled externally by the contractor. By accepting
              this agreement, you acknowledge that QuoteLock has no involvement in
              payment processing or verification.
            </p>
          </div>

          {/* Client Actions */}
          <PublicAgreementActions
            agreement={agreement}
            isExpired={isExpired}
          />

          {/* Timeline */}
          <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Timeline
            </h2>
            <AuditTimeline events={agreement.auditEvents} showActor={true} />
          </div>
        </div>

        <DisclaimerFooter />
      </div>
    </div>
  );
}

