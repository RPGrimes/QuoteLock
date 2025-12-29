"use client";

import { AgreementStatus } from "@prisma/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface AgreementActionsProps {
  agreementId: string;
  currentStatus: AgreementStatus;
  onStatusUpdate?: () => void;
}

// Client-side version of valid transitions
const VALID_NEXT_STATUS: Record<AgreementStatus, AgreementStatus | null> = {
  DRAFT: "SENT",
  SENT: "ACCEPTED",
  ACCEPTED: "DEPOSIT_SENT",
  DEPOSIT_SENT: "DEPOSIT_RECEIVED",
  DEPOSIT_RECEIVED: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
  COMPLETED: null,
  CANCELLED: null,
};

export default function AgreementActions({
  agreementId,
  currentStatus,
  onStatusUpdate,
}: AgreementActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: AgreementStatus) => {
    setIsLoading(newStatus);
    setError(null);

    try {
      const response = await fetch(`/api/agreements/${agreementId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        router.refresh();
        onStatusUpdate?.();
      } else {
        setError(result.error || "Failed to update status");
      }
    } catch (err) {
      setError("Failed to update status");
    } finally {
      setIsLoading(null);
    }
  };

  const actionLabels: Record<AgreementStatus, string> = {
    DRAFT: "Send Agreement",
    SENT: "Mark as Accepted",
    ACCEPTED: "Mark Deposit Sent",
    DEPOSIT_SENT: "Mark Deposit Received",
    DEPOSIT_RECEIVED: "Start Work",
    IN_PROGRESS: "Mark Completed",
    COMPLETED: "",
    CANCELLED: "",
  };

  const nextStatus = VALID_NEXT_STATUS[currentStatus];
  const canCancel = currentStatus !== "COMPLETED" && currentStatus !== "CANCELLED";

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {nextStatus && (
          <button
            onClick={() => handleStatusChange(nextStatus)}
            disabled={isLoading !== null}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading === nextStatus ? "Updating..." : actionLabels[currentStatus]}
          </button>
        )}

        {canCancel && (
          <button
            onClick={() => handleStatusChange("CANCELLED")}
            disabled={isLoading !== null}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading === "CANCELLED" ? "Cancelling..." : "Cancel Agreement"}
          </button>
        )}
      </div>
    </div>
  );
}

