"use server";

import { revalidatePath } from "next/cache";
import { brief } from "@/lib/assistant";
import { getJob, isStatus, sql } from "@/lib/db";
import { TEAM } from "@/lib/status";

export type FormState = { error?: string; ok?: number; from?: string; to?: string };

const MAX_NOTE = 2000;

export async function addNote(jobId: number, _prev: FormState, form: FormData): Promise<FormState> {
  if (!Number.isInteger(jobId)) return { error: "Unknown job." };
  const body = String(form.get("body") ?? "").trim();
  const author = String(form.get("author") ?? "");
  if (!body) return { error: "Write a note first." };
  if (!TEAM.includes(author as (typeof TEAM)[number])) return { error: "Pick who's writing the note." };
  if (body.length > MAX_NOTE) return { error: `Keep notes under ${MAX_NOTE} characters.` };
  try {
    await sql`insert into job_events (job_id, kind, body, author) values (${jobId}, 'note', ${body}, ${author})`;
  } catch (e) {
    console.error("addNote failed", { jobId, e });
    return { error: "Couldn't save the note. Try again." };
  }
  revalidatePath(`/jobs/${jobId}`);
  return { ok: Date.now() };
}

export type BriefState = { text?: string; error?: string };

// One-paragraph handover brief from the job's notes and status history.
export async function briefJob(jobId: number): Promise<BriefState> {
  const data = Number.isInteger(jobId) ? await getJob(jobId) : null;
  if (!data) return { error: "Unknown job." };
  return { text: brief(data.job, data.events) };
}

export async function setStatus(jobId: number, _prev: FormState, form: FormData): Promise<FormState> {
  if (!Number.isInteger(jobId)) return { error: "Unknown job." };
  const status = form.get("status");
  if (!isStatus(status)) return { error: "Unknown status." };
  let from: string | undefined;
  try {
    await sql.begin(async (tx) => {
      const [prev] = await tx`select status from jobs where id = ${jobId} for update`;
      if (!prev || prev.status === status) return;
      from = prev.status;
      await tx`update jobs set status = ${status} where id = ${jobId}`;
      await tx`insert into job_events (job_id, kind, body) values (${jobId}, 'status', ${`${prev.status} → ${status}`})`;
    });
  } catch (e) {
    console.error("setStatus failed", { jobId, e });
    return { error: "Couldn't update status. Try again." };
  }
  revalidatePath("/");
  revalidatePath(`/jobs/${jobId}`);
  return { ok: Date.now(), from, to: status };
}

// Notes: edit in place, soft delete so Undo can bring one back.
export async function editNote(jobId: number, noteId: number, body: string): Promise<FormState> {
  body = body.trim();
  if (!Number.isInteger(jobId) || !Number.isInteger(noteId)) return { error: "Unknown note." };
  if (!body) return { error: "A note can't be empty. Delete it instead." };
  if (body.length > MAX_NOTE) return { error: `Keep notes under ${MAX_NOTE} characters.` };
  try {
    await sql`update job_events set body = ${body} where id = ${noteId} and job_id = ${jobId} and kind = 'note' and deleted_at is null`;
  } catch (e) {
    console.error("editNote failed", { noteId, e });
    return { error: "Couldn't save the change. Try again." };
  }
  revalidatePath(`/jobs/${jobId}`);
  return { ok: Date.now() };
}

export async function setNoteDeleted(jobId: number, noteId: number, deleted: boolean): Promise<FormState> {
  if (!Number.isInteger(jobId) || !Number.isInteger(noteId)) return { error: "Unknown note." };
  try {
    await sql`update job_events set deleted_at = ${deleted ? sql`now()` : null} where id = ${noteId} and job_id = ${jobId} and kind = 'note'`;
  } catch (e) {
    console.error("setNoteDeleted failed", { noteId, e });
    return { error: "Couldn't update the note. Try again." };
  }
  revalidatePath(`/jobs/${jobId}`);
  return { ok: Date.now() };
}
