import { getCurrentUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { getAgreementById } from "@/app/actions/agreements";
import StatusBadge from "@/components/status-badge";
import ShareButtons from "@/components/share-buttons";
import AgreementActions from "@/components/agreement-actions";
import AuditTimeline from "@/components/audit-timeline";
import DisclaimerFooter from "@/components/disclaimer-footer";
import PDFDownloadButton from "@/components/pdf-download-button";
import { notFound } from "next/navigation";

export default async function AgreementDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const agreement = await getAgreementById(params.id);

  if (!agreement) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                {agreement.title}
              </h1>
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge status={agreement.status} />
                {agreement.clientName && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    • {agreement.clientName}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Share Buttons */}
          <div className="rounded-lg bg-white dark:bg-gray-800 p-4 shadow">
            <h2 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              Share Agreement
            </h2>
            <div className="flex flex-wrap gap-3">
              <ShareButtons
                publicSlug={agreement.publicSlug}
                title={agreement.title}
              />
              <PDFDownloadButton
                agreementId={agreement.id}
                label="Download PDF"
              />
            </div>
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

          {/* Action Buttons */}
          <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Actions
            </h2>
            <AgreementActions
              agreementId={agreement.id}
              currentStatus={agreement.status}
            />
          </div>

          {/* Timeline */}
          <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Timeline
            </h2>
            <AuditTimeline events={agreement.auditEvents} />
          </div>
        </div>

        <DisclaimerFooter />
      </div>
    </div>
  );
}

