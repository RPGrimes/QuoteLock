import { AuditEvent, AuditActor, AuditEventType } from "@prisma/client";

interface AuditTimelineProps {
  events: (AuditEvent & {
    metadata: Record<string, unknown> | null;
  })[];
  showActor?: boolean; // Whether to show actor column
  className?: string;
}

const actorLabels: Record<AuditActor, string> = {
  CLIENT: "Client",
  CONTRACTOR: "Contractor",
  SYSTEM: "System",
};

const eventLabels: Record<AuditEventType, string> = {
  CREATED: "Agreement Created",
  UPDATED: "Agreement Updated",
  SENT: "Agreement Sent",
  VIEWED: "Agreement Viewed",
  ACCEPTED: "Agreement Accepted",
  REJECTED: "Agreement Rejected",
  EXPIRED: "Agreement Expired",
  DEPOSIT_SENT: "Deposit Sent",
  DEPOSIT_RECEIVED: "Deposit Received",
  IN_PROGRESS: "Work Started",
  COMPLETED: "Agreement Completed",
  CANCELLED: "Agreement Cancelled",
  CORRECTION: "Correction Added",
  STATUS_REVERTED: "Status Reverted",
};

const actorColors: Record<AuditActor, string> = {
  CLIENT: "bg-green-500",
  CONTRACTOR: "bg-blue-500",
  SYSTEM: "bg-gray-500",
};

/**
 * Reusable Audit Timeline Component
 * Displays append-only audit events in chronological order
 * Clearly marks corrections and shows all metadata
 */
export default function AuditTimeline({
  events,
  showActor = true,
  className = "",
}: AuditTimelineProps) {
  if (events.length === 0) {
    return (
      <div className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>
        No events recorded yet.
      </div>
    );
  }

  return (
    <div className={`flow-root ${className}`}>
      <ul className="-mb-8">
        {events.map((event, idx) => {
          const isCorrection = event.type === "CORRECTION";
          const isLast = idx === events.length - 1;

          return (
            <li key={event.id}>
              <div className="relative pb-8">
                {!isLast && (
                  <span
                    className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3">
                  <div>
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        actorColors[event.actor]
                      } ${isCorrection ? "ring-2 ring-yellow-400 ring-offset-2" : ""}`}
                    >
                      <span className="text-xs font-medium text-white">
                        {actorLabels[event.actor][0]}
                      </span>
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {eventLabels[event.type] || event.type}
                        </p>
                        {isCorrection && (
                          <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:text-yellow-200">
                            Correction
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        {showActor && (
                          <>
                            <span>by {actorLabels[event.actor]}</span>
                            <span>•</span>
                          </>
                        )}
                        <time
                          dateTime={event.createdAt.toISOString()}
                          title={event.createdAt.toISOString()}
                        >
                          {new Date(event.createdAt).toUTCString()}
                        </time>
                        {event.ipAddress && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-xs">
                              IP: {event.ipAddress}
                            </span>
                          </>
                        )}
                      </div>
                      {event.metadata &&
                        Object.keys(event.metadata).length > 0 && (
                          <div className="mt-2 rounded-md bg-gray-50 dark:bg-gray-900/50 p-3 text-xs">
                            <p className="mb-1 font-medium text-gray-700 dark:text-gray-300">
                              Details:
                            </p>
                            <dl className="space-y-1">
                              {Object.entries(event.metadata).map(
                                ([key, value]) => (
                                  <div
                                    key={key}
                                    className="flex gap-2 sm:flex-row"
                                  >
                                    <dt className="font-medium text-gray-600 dark:text-gray-400">
                                      {key}:
                                    </dt>
                                    <dd className="text-gray-900 dark:text-gray-100">
                                      {typeof value === "object"
                                        ? JSON.stringify(value, null, 2)
                                        : String(value)}
                                    </dd>
                                  </div>
                                )
                              )}
                            </dl>
                          </div>
                        )}
                      {isCorrection && event.metadata && (
                        <div className="mt-2 rounded-md border-2 border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 p-3">
                          <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-200">
                            ⚠️ Correction Notice
                          </p>
                          {event.metadata.description && (
                            <p className="mt-1 text-xs text-yellow-800 dark:text-yellow-300">
                              {String(event.metadata.description)}
                            </p>
                          )}
                          {event.metadata.affectedFields && (
                            <p className="mt-1 text-xs text-yellow-800 dark:text-yellow-300">
                              Affected:{" "}
                              {Array.isArray(event.metadata.affectedFields)
                                ? event.metadata.affectedFields.join(", ")
                                : String(event.metadata.affectedFields)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

