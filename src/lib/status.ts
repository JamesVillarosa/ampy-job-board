// Shared by server and client code, so no DB imports here.
export const STATUSES = ["Scheduled", "In Progress", "On Hold", "Completed", "Cancelled"] as const;
export type Status = (typeof STATUSES)[number];
export const isStatus = (s: unknown): s is Status => STATUSES.includes(s as Status);

export const STATUS_STYLE: Record<Status, string> = {
  Scheduled: "bg-sky-50 text-sky-800 ring-sky-200",
  "In Progress": "bg-orange-50 text-orange-800 ring-orange-200",
  "On Hold": "bg-amber-50 text-amber-900 ring-amber-200",
  Completed: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  Cancelled: "bg-stone-100 text-stone-600 ring-stone-200",
};
