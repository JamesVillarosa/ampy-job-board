"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Turn = { q: string; a?: string; error?: string };
const SUGGESTIONS = ["What's overdue?", "Biggest open job?", "What's on in Strathdale?"];

export function AskBoard() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLOListElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const root = useRef<HTMLDivElement>(null);
  // Phones: tuck the launcher away while scrolling down so it never covers a date or name; back on scroll up.
  const [tucked, setTucked] = useState(false);
  useEffect(() => {
    let last = scrollY;
    const onScroll = () => {
      if (Math.abs(scrollY - last) < 8) return;
      setTucked(scrollY > last && scrollY > 80);
      last = scrollY;
    };
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
  // On document: the Ask button disables while pending, which drops focus out of the panel.
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      launcher.current?.focus();
    };
    // Pointer down anywhere outside the panel and launcher closes it, like a popover.
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);
  useEffect(() => {
    log.current?.lastElementChild?.scrollIntoView({ block: "nearest" });
  }, [turns]);

  async function ask(q: string) {
    q = q.trim();
    if (!q || pending) return;
    setTurns((t) => [...t, { q }]);
    setPending(true);
    try {
      const res = await fetch("/api/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: q }) });
      const body = await res.json();
      setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { q, a: body.answer, error: body.error } : x)));
    } catch {
      setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { q, error: "Network error. Try again." } : x)));
    } finally {
      setPending(false);
      input.current?.focus();
    }
  }

  return (
    <div ref={root} className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      <div
        id="ask-panel"
        role="dialog"
        aria-label="Ask the board"
        hidden={!open}
        className="ask-panel flex max-h-[min(560px,calc(100dvh-7rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_24px_60px_-20px_rgb(40_20_5/0.45)] ring-1 ring-line"
      >
        <div className="brand-panel px-5 py-4 text-white">
          <p className="font-bold">Ask the board</p>
          <p className="text-xs font-medium text-white/85">Ask anything about today’s jobs.</p>
        </div>

        <ol ref={log} className="flex-1 space-y-4 overflow-y-auto px-5 py-4 text-sm" aria-live="polite">
          {turns.length === 0 && (
            <li className="text-muted">Ask about overdue jobs, holds, bookings, suburbs, techs or the pipeline.</li>
          )}
          {turns.map((t, i) => (
            <li key={i} className="enter space-y-2">
              <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-ink px-3.5 py-2 font-medium text-white">{t.q}</p>
              {t.a ? (
                <p className="w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-canvas px-3.5 py-2 leading-relaxed whitespace-pre-wrap">{withLinks(t.a)}</p>
              ) : t.error ? (
                <p role="alert" className="font-semibold text-red-700">{t.error}</p>
              ) : (
                <p className="flex gap-1 px-1 py-2" aria-label="Thinking">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="size-1.5 animate-pulse rounded-full bg-brand" style={{ animationDelay: `${d * 120}ms` }} />
                  ))}
                </p>
              )}
            </li>
          ))}
        </ol>

        {turns.length === 0 && (
          <div className="flex flex-wrap gap-1.5 px-5 pb-3">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => ask(s)} className="h-8 rounded-full bg-brand-soft px-3 text-xs font-bold text-brand-deep transition-[background-color,transform] duration-150 ease-out hover:bg-brand/15 active:scale-[0.97]">
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          className="flex gap-2 border-t border-line p-3"
          onSubmit={(e) => {
            e.preventDefault();
            ask(input.current!.value);
            input.current!.value = "";
          }}
        >
          <label htmlFor="ask-input" className="sr-only">Question</label>
          <input
            ref={input}
            id="ask-input"
            maxLength={300}
            autoComplete="off"
            placeholder="e.g. Who's on hold and why?"
            className="h-10 min-w-0 flex-1 rounded-xl bg-canvas px-3 text-sm font-medium ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-brand disabled:opacity-60"
          />
          <button disabled={pending} className="h-10 rounded-xl bg-brand px-4 text-sm font-bold text-white transition-[background-color,transform,opacity] duration-150 ease-out hover:bg-brand active:scale-[0.97] disabled:opacity-50">
            Ask
          </button>
        </form>
      </div>

      <button
        ref={launcher}
        aria-expanded={open}
        aria-controls="ask-panel"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close" : "Ask the board"}
        className={`${tucked && !open ? "pointer-events-none translate-y-20 opacity-0 sm:pointer-events-auto sm:translate-y-0 sm:opacity-100" : ""} flex size-11 items-center justify-center gap-2 rounded-full sm:h-10 sm:w-auto sm:pr-4 sm:pl-3.5 bg-ink text-sm font-bold text-white shadow-[0_12px_30px_-10px_rgb(40_20_5/0.6)] transition-[background-color,transform,opacity] duration-200 ease-out hover:bg-ink/90 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand`}
      >
        <svg aria-hidden viewBox="0 0 20 20" className="size-4 text-brand" fill="currentColor"><path d="M10 1l2.2 5.8L18 9l-5.8 2.2L10 17l-2.2-5.8L2 9l5.8-2.2L10 1Z" /></svg>
        {/* Icon only on phones so it never sits over a job's value or buttons. */}
        <span aria-hidden className="hidden sm:inline">{open ? "Close" : "Ask"}</span>
      </button>
    </div>
  );
}

// Answers mark job refs as [AMP-1041](/jobs/2); render those as links, the rest as text.
function withLinks(text: string) {
  return text.split(/(\[[^\]]+\]\(\/jobs\/\d+\))/).map((part, i) => {
    const m = part.match(/^\[([^\]]+)\]\((\/jobs\/\d+)\)$/);
    return m ? (
      <Link key={i} href={m[2]} className="font-bold text-brand-deep underline decoration-brand/30 underline-offset-2 hover:decoration-brand">
        {m[1]}
      </Link>
    ) : (
      part
    );
  });
}
