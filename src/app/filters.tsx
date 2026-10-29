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
  // Dim the old results while a search loads.
  useEffect(() => {
    if (pending) document.documentElement.dataset.busy = "";
    else delete document.documentElement.dataset.busy;
  }, [pending]);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastPushed = useRef(params.get("q") ?? "");

  // Sync the box only when the URL changed from elsewhere (back button, "clear filters"),
  // never from our own debounced push, or it would clobber what the user is still typing.
  const urlQ = params.get("q") ?? "";
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const focus = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key !== "/" || t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      e.preventDefault();
      input.current?.focus();
    };
    document.addEventListener("keydown", focus);
    return () => document.removeEventListener("keydown", focus);
  }, []);
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
      <label className="relative min-w-0 flex-1 lg:w-96">
        <span className="sr-only">Search jobs</span>
        <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted">
          <circle cx="9" cy="9" r="6" /><path d="m14 14 3.5 3.5" strokeLinecap="round" />
        </svg>
        <input
          ref={input}
          type="search"
          aria-keyshortcuts="/"
          name="q"
          value={q}
          placeholder="Search customer, suburb or job number"
          autoComplete="off"
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => push("q", v.trim()), 200);
          }}
          className={`${field} w-full pr-10 pl-10 placeholder:text-muted`}
        />
        <kbd aria-hidden className={`pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border border-line px-1.5 text-[11px] leading-5 text-muted sm:block ${pending || q ? "opacity-0" : ""}`}>/</kbd>
        <span aria-hidden className={`absolute top-1/2 right-3.5 size-4 -translate-y-1/2 rounded-full border-2 border-line border-t-brand transition-opacity duration-150 ${pending ? "animate-spin opacity-100" : "opacity-0"}`} />
      </label>
      <SortMenu
        value={params.get("sort") ?? "attention"}
        onChange={(v) => {
          // Rows re-sort on the client (Sorted), so only the URL changes: no server round trip.
          const next = new URLSearchParams(params);
          if (v === "attention") next.delete("sort");
          else next.set("sort", v);
          history.replaceState(null, "", `${pathname}?${next}`);
        }}
      />
    </form>
  );
}

const SORTS = [
  ["attention", "Needs attention first"],
  ["newest", "Latest booked"],
  ["oldest", "Earliest booked"],
  ["value", "Highest value"],
  ["customer", "Customer A–Z"],
] as const;

// Listbox menu in place of a native <select>: same keyboard model (arrows, Enter, Escape), styled to match.
function SortMenu({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const current = SORTS.find(([v]) => v === value) ?? SORTS[0];

  useEffect(() => {
    if (!open) return;
    list.current?.focus();
    const close = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  function show() {
    setActive(SORTS.indexOf(current));
    setOpen(true);
  }
  function choose(i: number) {
    setOpen(false);
    button.current?.focus();
    if (SORTS[i][0] !== value) onChange(SORTS[i][0]);
  }

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Sort jobs: ${current[1]}`}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            show();
          }
        }}
        className={`${field} flex items-center gap-2 px-3.5 whitespace-nowrap transition-[box-shadow,transform] active:scale-[0.97]`}
      >
        <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-4 text-muted">
          <path d="M4 6h12M6 10h8M8 14h4" />
        </svg>
        <span className="hidden sm:inline">{current[1]}</span>
        <svg aria-hidden viewBox="0 0 20 20" fill="currentColor" className={`size-4 text-muted transition-transform duration-200 ease-out ${open ? "rotate-180" : ""}`}>
          <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z" />
        </svg>
      </button>
      {open && (
        <ul
          ref={list}
          role="listbox"
          tabIndex={-1}
          aria-label="Sort jobs"
          aria-activedescendant={`sort-${SORTS[active][0]}`}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => (i + (e.key === "ArrowDown" ? 1 : SORTS.length - 1)) % SORTS.length);
            } else if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              choose(active);
            } else if (e.key === "Escape" || e.key === "Tab") {
              setOpen(false);
              button.current?.focus();
            }
          }}
          className="pop absolute top-full right-0 z-30 mt-2 w-52 origin-top-right rounded-xl bg-white p-1.5 shadow-[0_16px_40px_-12px_rgb(40_20_5/0.3)] ring-1 ring-line outline-none"
        >
          {SORTS.map(([v, label], i) => (
            <li
              key={v}
              id={`sort-${v}`}
              role="option"
              aria-selected={v === current[0]}
              onPointerEnter={() => setActive(i)}
              onClick={() => choose(i)}
              className={`flex h-10 cursor-pointer items-center justify-between rounded-lg px-3 text-sm font-medium ${i === active ? "bg-brand-soft text-brand-deep" : "text-ink/80"}`}
            >
              {label}
              {v === current[0] && (
                <svg aria-hidden viewBox="0 0 20 20" fill="currentColor" className="size-4 text-brand">
                  <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
