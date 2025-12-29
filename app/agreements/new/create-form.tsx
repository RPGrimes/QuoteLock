"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAgreement } from "@/app/actions/agreements";
import DisclaimerFooter from "@/components/disclaimer-footer";

interface CreateAgreementFormProps {
  user: {
    defaultCurrency: string | null;
    defaultBankDetails: string | null;
    country: string | null;
    businessName: string | null;
  };
}

export default function CreateAgreementForm({ user }: CreateAgreementFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalPrice, setTotalPrice] = useState<string>("");
  const [depositPercentage, setDepositPercentage] = useState<number>(10);
  const [currency, setCurrency] = useState<string>(user.defaultCurrency || "GBP");

  // Calculate deposit and balance based on total price and percentage
  const depositAmount = totalPrice ? (parseFloat(totalPrice) * depositPercentage) / 100 : 0;
  const balanceDue = totalPrice ? parseFloat(totalPrice) - depositAmount : 0;

  const currencySymbols: Record<string, string> = {
    GBP: "£",
    USD: "$",
    EUR: "€",
    AUD: "A$",
    NZD: "NZ$",
  };

  const formatCurrency = (amount: number) => {
    const symbol = currencySymbols[currency] || currency;
    return `${symbol}${amount.toFixed(2)}`;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    
    // Set calculated values
    formData.set("depositAmount", depositAmount.toFixed(2));
    formData.set("balanceDue", balanceDue.toFixed(2));
    formData.set("currency", currency);

    try {
      const result = await createAgreement(formData);
      if (result?.success === false) {
        setError(result.error || "Failed to create agreement");
        setIsLoading(false);
      }
      // If successful, createAgreement redirects, so we don't need to handle that
    } catch (err) {
      setError("Failed to create agreement. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 shadow p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Agreement Title *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., Website Development Project"
            />
          </div>

          <div>
            <label
              htmlFor="currency"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Currency *
            </label>
            <select
              id="currency"
              name="currency"
              required
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="GBP">GBP (£)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="AUD">AUD (A$)</option>
              <option value="NZD">NZD (NZ$)</option>
            </select>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="clientName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Client Name
            </label>
            <input
              id="clientName"
              name="clientName"
              type="text"
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Client's name"
            />
          </div>

          <div>
            <label
              htmlFor="clientEmail"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Client Email
            </label>
            <input
              id="clientEmail"
              name="clientEmail"
              type="email"
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="client@example.com"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="workIncluded"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Work Included *
          </label>
          <textarea
            id="workIncluded"
            name="workIncluded"
            rows={4}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Describe what is included in this agreement..."
          />
        </div>

        <div>
          <label
            htmlFor="workExcluded"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Work Excluded *
          </label>
          <textarea
            id="workExcluded"
            name="workExcluded"
            rows={4}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Describe what is NOT included in this agreement..."
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="totalPrice"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Total Price *
            </label>
            <input
              id="totalPrice"
              name="totalPrice"
              type="number"
              step="0.01"
              required
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label
              htmlFor="depositPercentage"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Deposit Percentage *
            </label>
            <select
              id="depositPercentage"
              name="depositPercentage"
              required
              value={depositPercentage}
              onChange={(e) => setDepositPercentage(parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {Array.from({ length: 20 }, (_, i) => {
                const percent = (i + 1) * 5;
                const amount = totalPrice ? (parseFloat(totalPrice) * percent) / 100 : 0;
                return (
                  <option key={percent} value={percent}>
                    {percent}% - {formatCurrency(amount)}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="depositAmount"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Deposit Amount (calculated)
            </label>
            <input
              id="depositAmount"
              name="depositAmount"
              type="text"
              readOnly
              value={formatCurrency(depositAmount)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 cursor-not-allowed"
            />
          </div>

          <div>
            <label
              htmlFor="balanceDue"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Balance Due (calculated)
            </label>
            <input
              id="balanceDue"
              name="balanceDue"
              type="text"
              readOnly
              value={formatCurrency(balanceDue)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="paymentInstructions"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Payment Instructions *
          </label>
          <textarea
            id="paymentInstructions"
            name="paymentInstructions"
            rows={3}
            required
            defaultValue={user.defaultBankDetails || ""}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Bank details, payment methods, etc."
          />
        </div>

        <div>
          <label
            htmlFor="externalPaymentLink"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            External Payment Link (optional)
          </label>
          <input
            id="externalPaymentLink"
            name="externalPaymentLink"
            type="text"
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="https://..."
          />
        </div>

        <div>
          <label
            htmlFor="cancellationTerms"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Cancellation Terms *
          </label>
          <textarea
            id="cancellationTerms"
            name="cancellationTerms"
            rows={3}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Terms for cancellation..."
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="governingCountry"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Governing Country *
            </label>
            <input
              id="governingCountry"
              name="governingCountry"
              type="text"
              required
              defaultValue={user.country || ""}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., United States"
            />
          </div>

          <div>
            <label
              htmlFor="expiresAt"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Expires At (optional)
            </label>
            <input
              id="expiresAt"
              name="expiresAt"
              type="datetime-local"
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md bg-gray-200 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating..." : "Create Agreement"}
          </button>
        </div>
      </form>

      <DisclaimerFooter />
    </div>
  );
}

