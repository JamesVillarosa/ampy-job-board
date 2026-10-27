"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

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
    <form role="search" className="flex flex-1 gap-2 sm:max-w-md" onSubmit={(e) => e.preventDefault()}>
      <label className="relative flex-1">
        <span className="sr-only">Search customers</span>
        <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400">
          <circle cx="9" cy="9" r="6" /><path d="m14 14 3.5 3.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          name="q"
          value={q}
          placeholder="Search customer…"
          autoComplete="off"
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => push("q", v.trim()), 200);
          }}
          className="h-10 w-full rounded-lg border border-stone-300 bg-white pr-9 pl-9 text-sm shadow-xs outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-stone-400 focus:border-brand focus:ring-3 focus:ring-brand/15"
        />
        <span aria-hidden className={`absolute top-1/2 right-3 size-3.5 -translate-y-1/2 rounded-full border-2 border-stone-300 border-t-brand transition-opacity duration-150 ${pending ? "animate-spin opacity-100" : "opacity-0"}`} />
      </label>
      <label>
        <span className="sr-only">Sort jobs</span>
        <select
          name="sort"
          value={params.get("sort") ?? "newest"}
          onChange={(e) => push("sort", e.target.value === "newest" ? "" : e.target.value)}
          className="h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm shadow-xs outline-none focus:border-brand focus:ring-3 focus:ring-brand/15"
        >
          <option value="newest">Latest date</option>
          <option value="oldest">Earliest date</option>
          <option value="value">Highest value</option>
          <option value="customer">Customer A–Z</option>
        </select>
      </label>
    </form>
  );
}
