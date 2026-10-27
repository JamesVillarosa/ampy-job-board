"use server";

import { revalidatePath } from "next/cache";
import { isStatus, sql } from "@/lib/db";

export type FormState = { error?: string; ok?: number };

const MAX_NOTE = 2000;

export async function addNote(jobId: number, _prev: FormState, form: FormData): Promise<FormState> {
  if (!Number.isInteger(jobId)) return { error: "Unknown job." };
  const body = String(form.get("body") ?? "").trim();
  if (!body) return { error: "Write a note first." };
  if (body.length > MAX_NOTE) return { error: `Keep notes under ${MAX_NOTE} characters.` };
  try {
    await sql`insert into job_events (job_id, kind, body) values (${jobId}, 'note', ${body})`;
  } catch (e) {
    console.error("addNote failed", { jobId, e });
    return { error: "Couldn't save the note. Try again." };
  }
  revalidatePath(`/jobs/${jobId}`);
  return { ok: Date.now() };
}

export async function setStatus(jobId: number, _prev: FormState, form: FormData): Promise<FormState> {
  if (!Number.isInteger(jobId)) return { error: "Unknown job." };
  const status = form.get("status");
  if (!isStatus(status)) return { error: "Unknown status." };
  try {
    await sql.begin(async (tx) => {
      const [prev] = await tx`select status from jobs where id = ${jobId} for update`;
      if (!prev || prev.status === status) return;
      await tx`update jobs set status = ${status} where id = ${jobId}`;
      await tx`insert into job_events (job_id, kind, body) values (${jobId}, 'status', ${`${prev.status} → ${status}`})`;
    });
  } catch (e) {
    console.error("setStatus failed", { jobId, e });
    return { error: "Couldn't update status. Try again." };
  }
  revalidatePath("/");
  revalidatePath(`/jobs/${jobId}`);
  return { ok: Date.now() };
}
