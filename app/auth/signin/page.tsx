import { Suspense } from "react";
import SignInForm from "./signin-form";

export default function SignInPage({
  searchParams,
}: {
  searchParams: { signup?: string; error?: string };
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">QuoteLock</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Sign in to your account
          </p>
        </div>

        {searchParams.signup === "success" && (
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-800 dark:text-green-200">
            Account created successfully! Please sign in.
          </div>
        )}

        {searchParams.error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-800 dark:text-red-200">
            {searchParams.error}
          </div>
        )}

        <Suspense fallback={<div>Loading...</div>}>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}

