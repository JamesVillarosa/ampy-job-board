"use client";

import { createContext, use, useActionState, useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { STATUS_STYLE, STATUSES, TEAM, type Status } from "@/lib/status";
import { addNote, briefJob, editNote, setNoteDeleted, setStatus, type BriefState, type FormState } from "./actions";

const MAX = 2000;
const primary =
  "inline-flex h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-bold text-white transition-[background-color,transform,opacity] duration-150 ease-out hover:bg-brand-deep active:scale-[0.97] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const quiet =
  "inline-flex h-9 items-center rounded-lg px-2.5 text-sm font-semibold text-muted transition-[background-color,color] duration-150 hover:bg-canvas hover:text-ink focus-visible:outline-2 focus-visible:outline-brand";

// One toast at a time, bottom centre, with an optional Undo. Hides itself after 6s.
function Toast({ text, onUndo, onClose }: { text: string; onUndo?: () => void; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [text, onClose]);
  return (
    <div role="status" className="pop fixed bottom-20 left-1/2 sm:bottom-5 z-50 flex -translate-x-1/2 items-center gap-4 rounded-2xl bg-ink py-2.5 pr-2.5 pl-5 text-[15px] font-medium text-white shadow-[0_16px_40px_-12px_rgb(40_20_5/0.6)]">
      {text}
      {onUndo && (
        <button onClick={onUndo} className="h-9 rounded-xl bg-white/12 px-3.5 text-sm font-bold text-white transition-colors hover:bg-white/20">
          Undo
        </button>
      )}
    </div>
  );
}

// Page-level toast, so a deleted note's Undo outlives the note's own component.
type ToastMsg = { text: string; undo?: () => void };
const ToastCtx = createContext<(t: ToastMsg) => void>(() => {});
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [t, setT] = useState<ToastMsg>();
  return (
    <ToastCtx value={setT}>
      {children}
      {t && <Toast text={t.text} onClose={() => setT(undefined)} onUndo={t.undo && (() => (t.undo!(), setT(undefined)))} />}
    </ToastCtx>
  );
}

// Remember who's using this device, so they pick their name once.
const onStorage = (cb: () => void) => {
  addEventListener("storage", cb);
  return () => removeEventListener("storage", cb);
};
const storedAuthor = () => {
  try {
    return localStorage.getItem("ampy-author") ?? "";
  } catch {
    return "";
  }
};
function useAuthor() {
  const stored = useSyncExternalStore(onStorage, storedAuthor, () => "");
  const [picked, setPicked] = useState<string>();
  return [
    picked ?? stored,
    (a: string) => {
      setPicked(a);
      try {
        localStorage.setItem("ampy-author", a);
      } catch {}
    },
  ] as const;
}

export function NoteForm({ jobId }: { jobId: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addNote.bind(null, jobId), {});
  const [author, setAuthor] = useAuthor();
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={action} noValidate>
      <label htmlFor="note" className="font-semibold">Add a note</label>
      <textarea
        id="note"
        name="body"
        rows={3}
        maxLength={MAX}
        placeholder="e.g. Customer asked for a call 30 min before arrival. Side gate code 4821."
        aria-invalid={!!state.error}
        aria-describedby="note-error"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
        }}
        className="mt-2 block w-full resize-y rounded-xl bg-white px-4 py-3 text-base leading-relaxed ring-1 ring-line outline-none transition-shadow duration-150 placeholder:text-muted focus:ring-2 focus:ring-brand"
      />
      <fieldset className="mt-3">
        <legend className="text-sm font-semibold text-muted">Written by</legend>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {TEAM.map((t) => (
            <label key={t} className="cursor-pointer">
              <input type="radio" name="author" value={t} checked={author === t} onChange={() => setAuthor(t)} className="peer sr-only" />
              <span className="flex h-9 items-center rounded-full bg-white px-3.5 text-sm font-semibold text-ink/80 ring-1 ring-line transition-[background-color,color] duration-150 peer-checked:bg-ink peer-checked:text-white peer-checked:ring-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand">
                {t}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p id="note-error" role="alert" className="text-sm font-semibold text-red-700">{state.error}</p>
        <button type="submit" disabled={pending} className={primary}>
          {pending ? "Saving…" : "Save note"}
        </button>
      </div>
    </form>
  );
}

// A note in the timeline: who wrote it, plus edit and delete (with Undo).
export function NoteItem({ jobId, id, body }: { jobId: number; id: number; body: string }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string>();
  const toast = use(ToastCtx);
  const [pending, start] = useTransition();
  const text = useRef<HTMLTextAreaElement>(null);

  if (editing)
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await editNote(jobId, id, text.current!.value);
            if (r.error) setError(r.error);
            else setEditing(false);
          });
        }}
      >
        <label htmlFor={`edit-${id}`} className="sr-only">Edit note</label>
        <textarea id={`edit-${id}`} ref={text} defaultValue={body} rows={3} autoFocus className="block w-full rounded-xl px-3 py-2 text-base ring-2 ring-brand outline-none" />
        <div className="mt-2 flex items-center gap-2">
          <button disabled={pending} className={`${primary} h-9 px-4`}>{pending ? "Saving…" : "Save"}</button>
          <button type="button" onClick={() => setEditing(false)} className={quiet}>Cancel</button>
          <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>
        </div>
      </form>
    );

  return (
    <>
      <p className="text-base leading-relaxed break-words whitespace-pre-wrap text-ink">{body}</p>
      <div className="-ml-2.5 mt-1 flex gap-1">
        <button onClick={() => setEditing(true)} className={quiet}>Edit</button>
        <button
          disabled={pending}
          onClick={() =>
            start(async () => {
              if ((await setNoteDeleted(jobId, id, true)).ok) toast({ text: "Note deleted", undo: () => void setNoteDeleted(jobId, id, false) });
            })
          }
          className={quiet}
        >
          Delete
        </button>
      </div>
    </>
  );
}

export function AiBrief({ jobId }: { jobId: number }) {
  const [state, action, pending] = useActionState<BriefState>(() => briefJob(jobId), {});
  return (
    <section aria-labelledby="brief" className="rounded-2xl bg-ink p-5 text-white sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 id="brief" className="text-lg font-extrabold tracking-tight">Handover brief</h2>
        <form action={action}>
          <button disabled={pending} className={`${primary} h-9 px-4 focus-visible:outline-white`}>
            {pending ? "Writing…" : state.text ? "Refresh" : "Write brief"}
          </button>
        </form>
      </div>
      <div aria-live="polite" className="mt-4 text-[15px] leading-relaxed">
        {state.text ? (
          <p key={state.text} className="enter whitespace-pre-line text-white/90">{state.text}</p>
        ) : state.error ? (
          <p role="alert" className="font-semibold text-red-300">{state.error}</p>
        ) : (
          <p className="text-white/70">Sums up every note and status change into what the next tech needs to know.</p>
        )}
      </div>
    </section>
  );
}

export function StatusForm({ jobId, current }: { jobId: number; current: Status }) {
  const [state, action, pending] = useActionState<FormState, FormData>(setStatus.bind(null, jobId), {});
  // Each change shows its toast until closed; `closed` remembers which change was dismissed.
  const [closed, setClosed] = useState<number>();
  const toast = state.from && state.ok !== closed ? state : undefined;
  const form = useRef<HTMLFormElement>(null);

  return (
    <form ref={form} action={action}>
      <fieldset disabled={pending}>
        <legend className="sr-only">Status</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {STATUSES.map((s) => {
            const active = s === current;
            return (
              <button
                key={s}
                name="status"
                value={s}
                aria-pressed={active}
                className={`flex h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold whitespace-nowrap ring-1 transition-[background-color,color,box-shadow,transform] duration-150 ease-out active:scale-[0.97] disabled:cursor-wait focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                  active ? "bg-ink text-white ring-ink" : `bg-white ring-line hover:ring-ink/30 ${STATUS_STYLE[s].text}`
                }`}
              >
                <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                  <path d={STATUS_STYLE[s].icon} />
                </svg>
                {s}
              </button>
            );
          })}
        </div>
        {state.error && <p role="alert" className="mt-2 text-sm font-semibold text-red-700">{state.error}</p>}
      </fieldset>
      {/* Undo resubmits the previous status through the same action. */}
      <input type="hidden" name="status" value={toast?.from ?? ""} disabled={!toast} />
      {toast?.from && (
        <Toast
          text={pending ? "Updating…" : `Status changed to ${toast.to}`}
          onClose={() => setClosed(state.ok)}
          onUndo={() => {
            form.current?.requestSubmit();
            setClosed(state.ok);
          }}
        />
      )}
    </form>
  );
}
