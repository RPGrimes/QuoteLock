import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import StatusBadge from "@/components/status-badge";
import DisclaimerFooter from "@/components/disclaimer-footer";

export default async function PublicAgreementPage({
  params,
}: {
  params: { slug: string };
}) {
  const agreement = await prisma.agreement.findUnique({
    where: { publicSlug: params.slug },
    include: {
      user: {
        select: {
          businessName: true,
          country: true,
        },
      },
    },
  });

  if (!agreement) {
    notFound();
  }

  // Log view event
  try {
    const { logAuditEvent } = await import("@/lib/audit-utils");
    await logAuditEvent(agreement.id, "CLIENT", "VIEWED", {
      publicSlug: params.slug,
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
            <div className="mt-2 flex items-center gap-2">
              <StatusBadge status={agreement.status} />
              {agreement.user.businessName && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  • {agreement.user.businessName}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
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
        </div>

        <DisclaimerFooter />
      </div>
    </div>
  );
}

