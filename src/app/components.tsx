import { STATUS_STYLE, type Status } from "@/lib/status";

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${STATUS_STYLE[status].badge}`}>
      <span aria-hidden className={`size-1.5 rounded-full ${STATUS_STYLE[status].dot}`} />
      {status}
    </span>
  );
}
