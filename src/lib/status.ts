// Shared by server and client code, so no DB imports here.
export const STATUSES = ["Scheduled", "In Progress", "On Hold", "Completed", "Cancelled"] as const;
export type Status = (typeof STATUSES)[number];
export const isStatus = (s: unknown): s is Status => STATUSES.includes(s as Status);

// badge: pill on white. dot: status marker (badges, tabs, timeline).
export const STATUS_STYLE: Record<Status, { badge: string; dot: string }> = {
  Scheduled: { badge: "bg-sky-50 text-sky-800 ring-sky-200", dot: "bg-sky-500" },
  "In Progress": { badge: "bg-brand-soft text-brand-deep ring-brand/30", dot: "bg-brand" },
  "On Hold": { badge: "bg-amber-50 text-amber-800 ring-amber-200", dot: "bg-amber-500" },
  Completed: { badge: "bg-emerald-50 text-emerald-800 ring-emerald-200", dot: "bg-emerald-500" },
  Cancelled: { badge: "bg-stone-100 text-stone-500 ring-stone-200", dot: "bg-stone-400" },
};

// Who can sign a note. shortcut: fixed list, no login; swap for real accounts when the app gets sign-in.
export const TEAM = ["Office", "Ethan", "Josh", "Liam", "Mia"] as const;
