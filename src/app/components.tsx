import { STATUS_STYLE, type Status } from "@/lib/status";

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap ${STATUS_STYLE[status]}`}>
      <span aria-hidden className="size-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}
