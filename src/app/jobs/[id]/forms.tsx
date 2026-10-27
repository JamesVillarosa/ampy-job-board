"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { STATUSES, type Status } from "@/lib/status";
import { addNote, setStatus, type FormState } from "./actions";

const MAX = 2000;

export function NoteForm({ jobId }: { jobId: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addNote.bind(null, jobId), {});
  const [length, setLength] = useState(0);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={action} onReset={() => setLength(0)}className="rounded-2xl bg-paper p-4 ring-1 ring-line transition-shadow duration-150 focus-within:ring-2 focus-within:ring-brand sm:p-5">
      <label htmlFor="note" className="text-[11px] font-bold tracking-wider text-muted uppercase">Add a note</label>
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
        className="mt-2 block w-full resize-y border-0 bg-transparent p-0 text-[15px] leading-relaxed font-medium outline-none placeholder:text-muted/70"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p id="note-error" role="alert" className="text-sm font-semibold text-red-700">{state.error}</p>
        <div className="flex items-center gap-3">
          <span className="tabular hidden text-xs text-muted sm:inline">{length > 0 ? `${length}/${MAX}` : "Ctrl + Enter to save"}</span>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-5 text-[13px] font-bold tracking-wide text-white uppercase shadow-[0_6px_16px_-6px_rgb(255_94_30/0.7)] transition-[background-color,transform,opacity] duration-150 ease-out hover:bg-brand-deep active:scale-[0.97] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {pending ? "Saving…" : "Save note"}
          </button>
        </div>
      </div>
    </form>
  );
}

export function StatusForm({ jobId, current }: { jobId: number; current: Status }) {
  const [state, action, pending] = useActionState<FormState, FormData>(setStatus.bind(null, jobId), {});
  return (
    <form action={action}>
      <fieldset disabled={pending}>
        <legend className="text-[11px] font-bold tracking-wider text-white/80 uppercase">Status</legend>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {STATUSES.map((s) => {
            const active = s === current;
            return (
              <button
                key={s}
                name="status"
                value={s}
                aria-pressed={active}
                className={`h-9 rounded-lg px-3 text-xs font-bold tracking-wide whitespace-nowrap uppercase transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96] disabled:cursor-wait focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  active ? "bg-white text-brand-deep shadow-sm" : "bg-white/12 text-white hover:bg-white/22"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
        <p role="status" className="mt-2 h-4 text-xs font-semibold text-white/85">{pending ? "Updating…" : state.error}</p>
      </fieldset>
    </form>
  );
}
