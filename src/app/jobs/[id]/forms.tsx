"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { STATUSES, type Status } from "@/lib/status";
import { addNote, briefJob, setStatus, type BriefState, type FormState } from "./actions";

const MAX = 2000;

export function NoteForm({ jobId }: { jobId: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addNote.bind(null, jobId), {});
  const [length, setLength] = useState(0);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={action} onReset={() => setLength(0)} className="rounded-2xl bg-canvas p-4 ring-1 ring-line transition-shadow duration-150 focus-within:ring-2 focus-within:ring-brand">
      <label htmlFor="note" className="text-sm font-bold">Add a note</label>
      <textarea
        id="note"
        name="body"
        rows={3}
        maxLength={MAX}
        required
        placeholder="e.g. Customer asked for a call 30 min before arrival. Side gate code 4821."
        aria-invalid={!!state.error}
        aria-describedby={state.error ? "note-error" : undefined}
        onChange={(e) => setLength(e.target.value.length)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
        }}
        className="mt-1.5 block w-full resize-y border-0 bg-transparent p-0 text-[15px] leading-relaxed outline-none placeholder:text-muted"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p id="note-error" role="alert" className="text-sm font-semibold text-red-700">{state.error}</p>
        <div className="flex items-center gap-3">
          <span className="tabular hidden text-xs text-muted sm:inline">{length > 0 ? `${length}/${MAX}` : "Ctrl + Enter to save"}</span>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-brand px-5 text-sm font-bold text-white transition-[background-color,transform,opacity] duration-150 ease-out hover:bg-brand-deep active:scale-[0.97] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {pending ? "Saving…" : "Save note"}
          </button>
        </div>
      </div>
    </form>
  );
}

export function AiBrief({ jobId }: { jobId: number }) {
  const [state, action, pending] = useActionState<BriefState>(() => briefJob(jobId), {});
  return (
    <section aria-labelledby="brief" className="rounded-2xl bg-ink p-5 text-white sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 id="brief" className="text-lg font-extrabold tracking-tight">
          Handover brief
        </h2>
        <form action={action}>
          <button
            disabled={pending}
            className="h-9 rounded-xl bg-brand px-3.5 text-sm font-bold text-white transition-[background-color,transform,opacity] duration-150 ease-out hover:bg-brand-deep active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {pending ? "Writing…" : state.text ? "Refresh" : "Write brief"}
          </button>
        </form>
      </div>
      <div aria-live="polite" className="mt-4 text-sm leading-relaxed">
        {state.text ? (
          <p key={state.text} className="enter text-white/90">{state.text}</p>
        ) : state.error ? (
          <p role="alert" className="font-semibold text-red-300">{state.error}</p>
        ) : (
          <p className="text-white/60">
            Summarises the notes and status history into what the next tech needs to know.
          </p>
        )}
      </div>
    </section>
  );
}

export function StatusForm({ jobId, current }: { jobId: number; current: Status }) {
  const [state, action, pending] = useActionState<FormState, FormData>(setStatus.bind(null, jobId), {});
  return (
    <form action={action}>
      <fieldset disabled={pending}>
        <legend className="sr-only">Status</legend>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => {
            const active = s === current;
            return (
              <button
                key={s}
                name="status"
                value={s}
                aria-pressed={active}
                className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96] disabled:cursor-wait focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  active ? "bg-white text-brand-deep shadow-sm" : "bg-white/12 text-white hover:bg-white/22"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
        <p role="status" className="mt-2 h-4 text-xs font-semibold text-white/90">{pending ? "Updating…" : state.error}</p>
      </fieldset>
    </form>
  );
}
