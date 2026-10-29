import Image from "next/image";
import { OVERDUE_ICON, STATUS_STYLE, type Status } from "@/lib/status";

// Icon + coloured label; an overdue Scheduled job shows one red "Overdue" state instead of two chips.
export function StatusBadge({ status, daysOverdue }: { status: Status; daysOverdue?: number | null }) {
  const late = daysOverdue != null;
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap ${late ? "text-red-700" : STATUS_STYLE[status].text}`}>
      <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0">
        <path d={late ? OVERDUE_ICON : STATUS_STYLE[status].icon} />
      </svg>
      {late ? `Overdue · ${daysOverdue} ${daysOverdue === 1 ? "day" : "days"}` : status}
    </span>
  );
}

const PHOTOS = new Set(["Ethan", "Josh", "Liam", "Mia"]);

export function Tech({ name, size = 28 }: { name: string | null; size?: number }) {
  return (
    <span className="flex items-center gap-2 whitespace-nowrap">
      {name && PHOTOS.has(name) ? (
        <Image src={`/techs/${name}.jpg`} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover ring-2 ring-white" style={{ width: size, height: size }} />
      ) : (
        <span aria-hidden className="grid shrink-0 place-items-center rounded-full bg-stone-100 text-xs font-bold text-stone-500" style={{ width: size, height: size }}>?</span>
      )}
      <span className="font-medium">{name ?? "Unassigned"}</span>
    </span>
  );
}
