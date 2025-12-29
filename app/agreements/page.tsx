import { getCurrentUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { getAgreements } from "@/app/actions/agreements";
import { AgreementStatus } from "@prisma/client";
import Link from "next/link";
import StatusBadge from "@/components/status-badge";
import DisclaimerFooter from "@/components/disclaimer-footer";

export default async function AgreementsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const status = searchParams.status as AgreementStatus | undefined;
  const agreements = await getAgreements(status);

  const statusFilters: { label: string; value: AgreementStatus | "ALL" }[] = [
    { label: "All", value: "ALL" },
    { label: "Draft", value: "DRAFT" },
    { label: "Sent", value: "SENT" },
    { label: "Accepted", value: "ACCEPTED" },
    { label: "In Progress", value: "IN_PROGRESS" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              Agreements
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage your agreements
            </p>
          </div>
          <Link
            href="/agreements/new"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Agreement
          </Link>
        </div>

        {/* Status Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <Link
              key={filter.value}
              href={filter.value === "ALL" ? "/agreements" : `/agreements?status=${filter.value}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                (status === filter.value) ||
                (!status && filter.value === "ALL")
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {filter.label}
            </Link>
          ))}
        </div>

        {/* Agreements List */}
        {agreements.length === 0 ? (
          <div className="rounded-lg bg-white dark:bg-gray-800 p-12 text-center shadow">
            <p className="text-gray-500 dark:text-gray-400">
              No agreements found.
            </p>
            <Link
              href="/agreements/new"
              className="mt-4 inline-block text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Create your first agreement
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {agreements.map((agreement) => (
              <Link
                key={agreement.id}
                href={`/agreements/${agreement.id}`}
                className="block rounded-lg bg-white dark:bg-gray-800 p-4 shadow hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {agreement.title}
                      </h3>
                      <StatusBadge status={agreement.status} />
                    </div>
                    {agreement.clientName && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Client: {agreement.clientName}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: agreement.currency,
                      }).format(Number(agreement.totalPrice))}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                      Created {new Date(agreement.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <DisclaimerFooter />
      </div>
    </div>
  );
}

