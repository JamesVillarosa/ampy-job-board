// Shared by server and client code, so no DB imports here.
export const STATUSES = ["Scheduled", "In Progress", "On Hold", "Completed", "Cancelled"] as const;
export type Status = (typeof STATUSES)[number];
export const isStatus = (s: unknown): s is Status => STATUSES.includes(s as Status);

// text: label colour. dot: marker in chips, the split bar and the timeline. icon: 20x20 stroke path.
export const STATUS_STYLE: Record<Status, { text: string; dot: string; icon: string }> = {
  Scheduled: { text: "text-sky-700", dot: "bg-sky-500", icon: "M6.5 2.5v3m7-3v3M3 8h14M4.5 4h11A1.5 1.5 0 0 1 17 5.5v10a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 15.5v-10A1.5 1.5 0 0 1 4.5 4Z" },
  "In Progress": { text: "text-brand-deep", dot: "bg-brand", icon: "M11 2 4 11.5h5.5L9 18l7-9.5h-5.5L11 2Z" },
  "On Hold": { text: "text-amber-700", dot: "bg-amber-500", icon: "M7.5 4.5v11m5-11v11" },
  Completed: { text: "text-emerald-700", dot: "bg-emerald-500", icon: "M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Zm-10.5 0 2.5 2.5 4.5-5" },
  Cancelled: { text: "text-stone-500", dot: "bg-stone-400", icon: "M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0ZM7.5 7.5l5 5m0-5-5 5" },
};
export const OVERDUE_ICON = "M10 3 2.5 16.5h15L10 3Zm0 5.5v3.5m0 2.25v.25";

// Who can sign a note. shortcut: fixed list, no login; swap for real accounts when the app gets sign-in.
export const TEAM = ["Office", "Ethan", "Josh", "Liam", "Mia"] as const;
