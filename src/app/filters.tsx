"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

const field =
  "h-11 rounded-xl border-0 bg-white text-sm font-medium shadow-[0_1px_2px_rgb(60_30_10/0.06)] ring-1 ring-line outline-none transition-[box-shadow] duration-150 focus:ring-2 focus:ring-brand";

// Search + sort live in the URL so a filtered view can be shared or bookmarked.
export function Filters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastPushed = useRef(params.get("q") ?? "");

  // Sync the box only when the URL changed from elsewhere (back button, "clear filters"),
  // never from our own debounced push, or it would clobber what the user is still typing.
  const urlQ = params.get("q") ?? "";
  useEffect(() => {
    if (urlQ !== lastPushed.current) {
      lastPushed.current = urlQ;
      setQ(urlQ);
    }
  }, [urlQ]);

  function push(key: string, value: string) {
    if (key === "q") lastPushed.current = value;
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => router.replace(`${pathname}?${next}`, { scroll: false }));
  }

  return (
    <form role="search" className="flex w-full gap-2 lg:w-auto" onSubmit={(e) => e.preventDefault()}>
      <label className="relative min-w-0 flex-1 lg:w-80">
        <span className="sr-only">Search customers</span>
        <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted">
          <circle cx="9" cy="9" r="6" /><path d="m14 14 3.5 3.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          name="q"
          value={q}
          placeholder="Search"
          autoComplete="off"
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => push("q", v.trim()), 200);
          }}
          className={`${field} w-full pr-10 pl-10 placeholder:text-muted/80`}
        />
        <span aria-hidden className={`absolute top-1/2 right-3.5 size-4 -translate-y-1/2 rounded-full border-2 border-line border-t-brand transition-opacity duration-150 ${pending ? "animate-spin opacity-100" : "opacity-0"}`} />
      </label>
      <label>
        <span className="sr-only">Sort jobs</span>
        <select
          name="sort"
          value={params.get("sort") ?? "newest"}
          onChange={(e) => push("sort", e.target.value === "newest" ? "" : e.target.value)}
          className={`${field} px-3 font-semibold`}
        >
          <option value="newest">Latest booked</option>
          <option value="oldest">Earliest booked</option>
          <option value="value">Highest value</option>
          <option value="customer">Customer A–Z</option>
        </select>
      </label>
    </form>
  );
}
