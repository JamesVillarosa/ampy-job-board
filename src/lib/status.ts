// Shared by server and client code, so no DB imports here.
export const STATUSES = ["Scheduled", "In Progress", "On Hold", "Completed", "Cancelled"] as const;
export type Status = (typeof STATUSES)[number];
export const isStatus = (s: unknown): s is Status => STATUSES.includes(s as Status);

// badge: chip on light surfaces. bar: segment on the orange panel. dot: timeline marker.
export const STATUS_STYLE: Record<Status, { badge: string; bar: string; dot: string }> = {
  Scheduled: { badge: "bg-white text-ink ring-ink/15", bar: "bg-white/45", dot: "bg-ink/40" },
  "In Progress": { badge: "bg-brand text-white ring-brand", bar: "bg-white", dot: "bg-brand" },
  "On Hold": { badge: "bg-amber-100 text-amber-900 ring-amber-300/60", bar: "bg-amber-200", dot: "bg-amber-500" },
  Completed: { badge: "bg-emerald-50 text-emerald-800 ring-emerald-300/60", bar: "bg-ink/35", dot: "bg-emerald-600" },
  Cancelled: { badge: "bg-stone-100 text-muted ring-stone-300/60 line-through decoration-1", bar: "bg-ink/15", dot: "bg-stone-400" },
};
