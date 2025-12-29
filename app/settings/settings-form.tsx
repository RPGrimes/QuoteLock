"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSettings } from "@/app/actions/settings";

interface SettingsFormProps {
  user: {
    id: string;
    email: string;
    businessName: string | null;
    country: string | null;
    defaultCurrency: string | null;
    defaultBankDetails: string | null;
  };
}

export default function SettingsForm({ user }: SettingsFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await updateSettings(formData);
      if (result.success) {
        setSuccess(result.message || "Settings updated successfully");
        router.refresh();
      } else {
        setError(result.error || "Failed to update settings");
      }
    } catch (err) {
      setError("Failed to update settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 shadow p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={user.email}
            disabled
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Email cannot be changed
          </p>
        </div>

        <div>
          <label
            htmlFor="businessName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Business Name
          </label>
          <input
            id="businessName"
            name="businessName"
            type="text"
            defaultValue={user.businessName || ""}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Your Business Name"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            This will be prefilled when creating agreements
          </p>
        </div>

        <div>
          <label
            htmlFor="country"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Country
          </label>
          <input
            id="country"
            name="country"
            type="text"
            defaultValue={user.country || ""}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g., United States"
          />
        </div>

        <div>
          <label
            htmlFor="defaultCurrency"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Default Currency
          </label>
          <select
            id="defaultCurrency"
            name="defaultCurrency"
            defaultValue={user.defaultCurrency || "GBP"}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="GBP">GBP (£)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="AUD">AUD (A$)</option>
            <option value="NZD">NZD (NZ$)</option>
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            This will be prefilled when creating agreements
          </p>
        </div>

        <div>
          <label
            htmlFor="defaultBankDetails"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Default Bank / Payment Instructions
          </label>
          <textarea
            id="defaultBankDetails"
            name="defaultBankDetails"
            rows={4}
            defaultValue={user.defaultBankDetails || ""}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Bank account details, payment instructions, etc."
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            This will be prefilled when creating agreements
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-800 dark:text-green-200">
            {success}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

