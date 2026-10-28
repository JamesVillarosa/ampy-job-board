import { STATUS_STYLE, type Status } from "@/lib/status";

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1 ring-inset ${STATUS_STYLE[status].badge}`}>
      <span aria-hidden className={`size-1.5 rounded-full ${STATUS_STYLE[status].dot}`} />
      {status}
    </span>
  );
}

// Same colour for the same tech everywhere, so you can spot your own jobs at a glance.
const TINTS = ["bg-sky-100 text-sky-800", "bg-violet-100 text-violet-800", "bg-emerald-100 text-emerald-800", "bg-amber-100 text-amber-900", "bg-rose-100 text-rose-800"];

export function Tech({ name }: { name: string | null }) {
  const tint = name ? TINTS[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % TINTS.length] : "bg-stone-100 text-stone-500";
  return (
    <span className="flex items-center gap-2 whitespace-nowrap">
      <span aria-hidden className={`grid size-7 place-items-center rounded-full text-xs font-bold ${tint}`}>{name?.[0] ?? "?"}</span>
      <span className="font-medium">{name ?? "Unassigned"}</span>
    </span>
  );
}
