import { getCurrentUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { getAgreements } from "@/app/actions/agreements";
import Link from "next/link";
import StatusBadge from "@/components/status-badge";
import DisclaimerFooter from "@/components/disclaimer-footer";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const recentAgreements = await getAgreements();
  const recent = recentAgreements.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Welcome back, {user.businessName || user.email}
          </p>
        </div>

        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/agreements/new"
            className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Create Agreement
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Create a new agreement
            </p>
          </Link>

          <Link
            href="/agreements"
            className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              My Agreements
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              View all your agreements ({recentAgreements.length})
            </p>
          </Link>

          <Link
            href="/settings"
            className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Settings
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Manage your account settings
            </p>
          </Link>
        </div>

        {recent.length > 0 && (
          <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Agreements
              </h2>
              <Link
                href="/agreements"
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {recent.map((agreement) => (
                <Link
                  key={agreement.id}
                  href={`/agreements/${agreement.id}`}
                  className="block rounded-md border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {agreement.title}
                        </h3>
                        <StatusBadge status={agreement.status} />
                      </div>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: agreement.currency,
                        }).format(Number(agreement.totalPrice))}
                        {agreement.clientName && ` • ${agreement.clientName}`}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <DisclaimerFooter />
      </div>
    </div>
  );
}

