"use client";

import { useActionState, useEffect, useRef } from "react";
import { STATUSES, type Status } from "@/lib/status";
import { addNote, setStatus, type FormState } from "./actions";

const button =
  "inline-flex h-9 items-center justify-center rounded-lg bg-brand px-4 text-sm font-medium text-white shadow-sm transition-[background-color,transform,opacity] duration-150 ease-out hover:bg-brand-deep active:scale-[0.97] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function NoteForm({ jobId }: { jobId: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addNote.bind(null, jobId), {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={action} className="space-y-2">
      <label htmlFor="note" className="text-sm font-medium">Add a note</label>
      <textarea
        id="note"
        name="body"
        rows={3}
        maxLength={2000}
        required
        placeholder="e.g. Customer asked for a call 30 min before arrival"
        aria-invalid={!!state.error}
        aria-describedby={state.error ? "note-error" : undefined}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
        }}
        className="block w-full resize-y rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm shadow-xs outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-stone-400 focus:border-brand focus:ring-3 focus:ring-brand/15 aria-invalid:border-red-400"
      />
      <div className="flex items-center justify-between gap-3">
        <p id="note-error" role="alert" className="text-sm text-red-700">{state.error}</p>
        <button type="submit" disabled={pending} className={button}>
          {pending ? "Saving…" : "Save note"}
        </button>
      </div>
    </form>
  );
}

export function StatusForm({ jobId, current }: { jobId: number; current: Status }) {
  const [state, action, pending] = useActionState<FormState, FormData>(setStatus.bind(null, jobId), {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <label htmlFor="status" className="text-sm text-stone-500">Status</label>
      <select
        id="status"
        name="status"
        defaultValue={current}
        key={current}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        disabled={pending}
        className="h-9 rounded-lg border border-stone-300 bg-white px-3 text-sm shadow-xs outline-none focus:border-brand focus:ring-3 focus:ring-brand/15 disabled:opacity-60"
      >
        {STATUSES.map((s) => <option key={s}>{s}</option>)}
      </select>
      <noscript><button className={button}>Update</button></noscript>
      <span role="status" className="text-xs text-stone-500">{pending ? "Updating…" : state.error}</span>
    </form>
  );
}
