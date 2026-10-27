import { STATUS_STYLE, type Status } from "@/lib/status";

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-bold tracking-wide whitespace-nowrap uppercase ring-1 ring-inset ${STATUS_STYLE[status].badge}`}>
      {status}
    </span>
  );
}

export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-xs font-bold tracking-[0.14em] uppercase ${className}`}>{children}</p>;
}
