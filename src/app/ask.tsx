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
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
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
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      <div
        id="ask-panel"
        role="dialog"
        aria-label="Ask the board"
        hidden={!open}
        className="ask-panel flex max-h-[min(560px,calc(100dvh-7rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl bg-white shadow-[0_16px_40px_-12px_rgb(28_25_23/0.25)] ring-1 ring-line"
      >
        <div className="border-b border-line px-4 py-3">
          <p className="text-sm font-semibold">Ask the board</p>
          <p className="text-xs text-muted">Answers come from the live job list.</p>
        </div>

        <ol ref={log} className="flex-1 space-y-4 overflow-y-auto px-5 py-4 text-sm" aria-live="polite">
          {turns.length === 0 && (
            <li className="text-muted">Ask about overdue jobs, holds, bookings, suburbs, techs or the pipeline.</li>
          )}
          {turns.map((t, i) => (
            <li key={i} className="enter space-y-2">
              <p className="ml-auto w-fit max-w-[85%] rounded-lg bg-ink px-3 py-2 text-white">{t.q}</p>
              {t.a ? (
                <p className="w-fit max-w-[90%] rounded-lg bg-canvas px-3 py-2 leading-relaxed whitespace-pre-wrap">{withLinks(t.a)}</p>
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
              <button key={s} onClick={() => ask(s)} className="h-8 rounded-lg bg-white px-2.5 text-xs font-medium text-ink/80 ring-1 ring-line transition-[background-color,transform] duration-150 ease-out hover:bg-canvas active:scale-[0.97]">
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
            className="h-9 min-w-0 flex-1 rounded-lg bg-white px-3 text-sm ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-brand disabled:opacity-60"
          />
          <button disabled={pending} className="h-9 rounded-lg bg-brand px-3.5 text-sm font-medium text-white transition-[background-color,transform,opacity] duration-150 ease-out hover:bg-brand-deep active:scale-[0.97] disabled:opacity-50">
            Ask
          </button>
        </form>
      </div>

      <button
        ref={launcher}
        aria-expanded={open}
        aria-controls="ask-panel"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 items-center gap-2 rounded-lg bg-ink pr-3.5 pl-3 text-sm font-medium text-white shadow-[0_8px_20px_-8px_rgb(28_25_23/0.5)] transition-[background-color,transform] duration-150 ease-out hover:bg-ink/90 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <svg aria-hidden viewBox="0 0 20 20" className="size-4 text-brand" fill="currentColor"><path d="M10 1l2.2 5.8L18 9l-5.8 2.2L10 17l-2.2-5.8L2 9l5.8-2.2L10 1Z" /></svg>
        {open ? "Close" : "Ask the board"}
      </button>
    </div>
  );
}

// Answers mark job refs as [AMP-1041](/jobs/2); render those as links, the rest as text.
function withLinks(text: string) {
  return text.split(/(\[[^\]]+\]\(\/jobs\/\d+\))/).map((part, i) => {
    const m = part.match(/^\[([^\]]+)\]\((\/jobs\/\d+)\)$/);
    return m ? (
      <Link key={i} href={m[2]} className="font-mono font-medium text-brand-deep underline decoration-brand/30 underline-offset-2 hover:decoration-brand">
        {m[1]}
      </Link>
    ) : (
      part
    );
  });
}
