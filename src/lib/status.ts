// Shared by server and client code, so no DB imports here.
export const STATUSES = ["Scheduled", "In Progress", "On Hold", "Completed", "Cancelled"] as const;
export type Status = (typeof STATUSES)[number];
export const isStatus = (s: unknown): s is Status => STATUSES.includes(s as Status);

// badge: chip on white. dot: status marker in badges and the timeline.
export const STATUS_STYLE: Record<Status, { badge: string; dot: string }> = {
  Scheduled: { badge: "bg-white text-ink/80 ring-line", dot: "bg-stone-400" },
  "In Progress": { badge: "bg-brand-soft text-brand-deep ring-brand/25", dot: "bg-brand" },
  "On Hold": { badge: "bg-amber-50 text-amber-900 ring-amber-200", dot: "bg-amber-500" },
  Completed: { badge: "bg-emerald-50 text-emerald-800 ring-emerald-200", dot: "bg-emerald-600" },
  Cancelled: { badge: "bg-canvas text-muted ring-line", dot: "bg-stone-300" },
};
