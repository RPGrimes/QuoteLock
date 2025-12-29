import { getCurrentUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          QuoteLock
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8">
          Immutable Quote Record Keeper
        </p>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 mb-8">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Record acknowledgements and timestamps in an immutable audit trail.
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/signin"
            className="rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-md bg-gray-200 dark:bg-gray-700 px-6 py-3 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}

