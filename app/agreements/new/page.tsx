import { getCurrentUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import CreateAgreementForm from "./create-form";

export default async function NewAgreementPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Create Agreement
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Create a new agreement for your client
          </p>
        </div>

        <CreateAgreementForm user={user} />
      </div>
    </div>
  );
}

