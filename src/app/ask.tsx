"use client";

import { useEffect, useRef, useState } from "react";

type Turn = { q: string; a?: string; error?: string };
const SUGGESTIONS = ["What's overdue?", "Biggest open job?", "What's on in Strathdale?"];

export function AskBoard({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLOListElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) input.current?.focus();
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
    }
  }

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6" onKeyDown={(e) => {
        if (e.key !== "Escape" || !open) return;
        setOpen(false);
        launcher.current?.focus();
      }}>
      <div
        id="ask-panel"
        role="dialog"
        aria-label="Ask the board"
        hidden={!open}
        className="ask-panel flex max-h-[min(560px,calc(100dvh-7rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_24px_60px_-20px_rgb(40_20_5/0.45)] ring-1 ring-line"
      >
        <div className="brand-panel px-5 py-4 text-white">
          <p className="text-[11px] font-bold tracking-wider text-white/80 uppercase">Ask the board</p>
          <p className="mt-0.5 text-sm font-semibold">Questions answered from live jobs.</p>
        </div>

        <ol ref={log} className="flex-1 space-y-4 overflow-y-auto px-5 py-4 text-sm" aria-live="polite">
          {turns.length === 0 && (
            <li className="text-muted">{enabled ? "Try one of these, or type your own." : "AI is off. Set ANTHROPIC_API_KEY on the server to turn it on."}</li>
          )}
          {turns.map((t, i) => (
            <li key={i} className="rise space-y-2">
              <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-ink px-3.5 py-2 font-medium text-white">{t.q}</p>
              {t.a ? (
                <p className="w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-paper px-3.5 py-2 leading-relaxed font-medium whitespace-pre-wrap ring-1 ring-line">{t.a}</p>
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

        {enabled && turns.length === 0 && (
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
            disabled={!enabled}
            placeholder="e.g. Who's on hold and why?"
            className="h-10 min-w-0 flex-1 rounded-xl bg-paper px-3 text-sm font-medium ring-1 ring-line outline-none placeholder:text-muted/80 focus:ring-2 focus:ring-brand disabled:opacity-60"
          />
          <button disabled={!enabled || pending} className="h-10 rounded-xl bg-brand px-4 text-xs font-bold tracking-wide text-white uppercase transition-[background-color,transform,opacity] duration-150 ease-out hover:bg-brand-deep active:scale-[0.97] disabled:opacity-50">
            Ask
          </button>
        </form>
      </div>

      <button
        ref={launcher}
        aria-expanded={open}
        aria-controls="ask-panel"
        onClick={() => setOpen((o) => !o)}
        className="flex h-12 items-center gap-2 rounded-full bg-ink pr-5 pl-4 text-[13px] font-bold tracking-wide text-white uppercase shadow-[0_12px_30px_-10px_rgb(40_20_5/0.6)] ring-1 ring-white/20 transition-[background-color,transform] duration-150 ease-out hover:bg-ink/90 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <svg aria-hidden viewBox="0 0 20 20" className="size-4 text-brand" fill="currentColor"><path d="M10 1l2.2 5.8L18 9l-5.8 2.2L10 17l-2.2-5.8L2 9l5.8-2.2L10 1Z" /></svg>
        {open ? "Close" : "Ask the board"}
      </button>
    </div>
  );
}
