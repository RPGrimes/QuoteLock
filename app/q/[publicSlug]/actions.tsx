"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptAgreement, confirmDepositSent } from "@/app/actions/public-agreement";
import { AgreementStatus } from "@prisma/client";

interface PublicAgreementActionsProps {
  agreement: {
    id: string;
    publicSlug: string;
    status: AgreementStatus;
    expiresAt: Date | null;
  };
  isExpired: boolean;
}

export default function PublicAgreementActions({
  agreement,
  isExpired,
}: PublicAgreementActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isConfirmingDeposit, setIsConfirmingDeposit] = useState(false);
  const [acknowledgedBy, setAcknowledgedBy] = useState("");
  const [email, setEmail] = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [acceptChecked, setAcceptChecked] = useState(false);

  const canAccept =
    agreement.status === "SENT" && !isExpired && agreement.status !== "CANCELLED";
  const canConfirmDeposit =
    agreement.status === "ACCEPTED" &&
    !isExpired &&
    agreement.status !== "CANCELLED";

  const handleAccept = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsAccepting(true);

    if (!acceptChecked) {
      setError("You must acknowledge the disclaimer to accept this agreement");
      setIsAccepting(false);
      return;
    }

    const formData = new FormData();
    formData.set("publicSlug", agreement.publicSlug);
    formData.set("acknowledgedBy", acknowledgedBy);
    if (email) {
      formData.set("email", email);
    }

    try {
      const result = await acceptAgreement(formData);
      if (result.success) {
        setSuccess(result.message || "Agreement accepted successfully");
        router.refresh();
      } else {
        setError(result.error || "Failed to accept agreement");
      }
    } catch (err) {
      setError("Failed to accept agreement. Please try again.");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleConfirmDeposit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsConfirmingDeposit(true);

    const formData = new FormData();
    formData.set("publicSlug", agreement.publicSlug);
    if (transactionReference) {
      formData.set("transactionReference", transactionReference);
    }

    try {
      const result = await confirmDepositSent(formData);
      if (result.success) {
        setSuccess(result.message || "Deposit confirmation recorded");
        router.refresh();
      } else {
        setError(result.error || "Failed to confirm deposit");
      }
    } catch (err) {
      setError("Failed to confirm deposit. Please try again.");
    } finally {
      setIsConfirmingDeposit(false);
    }
  };

  if (!canAccept && !canConfirmDeposit) {
    return null;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-800 dark:text-green-200">
          {success}
        </div>
      )}

      {/* Accept Agreement */}
      {canAccept && (
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Accept Agreement
          </h2>
          <form onSubmit={handleAccept} className="space-y-4">
            <div>
              <label
                htmlFor="acknowledgedBy"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Your Name *
              </label>
              <input
                id="acknowledgedBy"
                name="acknowledgedBy"
                type="text"
                required
                value={acknowledgedBy}
                onChange={(e) => setAcknowledgedBy(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Your Email (optional)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="your@email.com"
              />
            </div>

            <div className="flex items-start">
              <input
                id="acceptCheckbox"
                type="checkbox"
                required
                checked={acceptChecked}
                onChange={(e) => setAcceptChecked(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="acceptCheckbox"
                className="ml-3 text-sm text-gray-700 dark:text-gray-300"
              >
                I acknowledge the disclaimer above and accept this agreement *
              </label>
            </div>

            <button
              type="submit"
              disabled={isAccepting || !acceptChecked}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAccepting ? "Accepting..." : "Accept Agreement"}
            </button>
          </form>
        </div>
      )}

      {/* Confirm Deposit Sent */}
      {canConfirmDeposit && (
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Confirm Deposit Sent
          </h2>
          <form onSubmit={handleConfirmDeposit} className="space-y-4">
            <div>
              <label
                htmlFor="transactionReference"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Transaction Reference (optional)
              </label>
              <input
                id="transactionReference"
                name="transactionReference"
                type="text"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Payment reference number"
                maxLength={255}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Optional: Provide a transaction reference if you have one
              </p>
            </div>

            <button
              type="submit"
              disabled={isConfirmingDeposit}
              className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConfirmingDeposit ? "Confirming..." : "Confirm Deposit Sent"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

