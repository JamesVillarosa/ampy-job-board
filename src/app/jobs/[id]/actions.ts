"use server";

import { revalidatePath } from "next/cache";
import { aiEnabled, claude } from "@/lib/ai";
import { getJob, isStatus, sql } from "@/lib/db";

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

export type BriefState = { text?: string; error?: string };

// One-paragraph handover brief from the job's notes and status history.
export async function briefJob(jobId: number): Promise<BriefState> {
  if (!aiEnabled()) return { error: "AI is off. Set ANTHROPIC_API_KEY to turn it on." };
  const data = Number.isInteger(jobId) ? await getJob(jobId) : null;
  if (!data) return { error: "Unknown job." };
  const { job, events } = data;
  const history = events
    .toReversed()
    .map((e) => `${e.created_at.toISOString().slice(0, 16)} ${e.kind}: ${e.body}`)
    .join("\n");
  try {
    const text = await claude(
      "You brief electricians at Ampy Electrical (Bendigo, AU) before they pick up a job. Plain Australian English, no preamble, no markdown. " +
        "Two to four short sentences: where the job is at, anything the tech must know on site (access, customer requests, parts), and the next action. " +
        "Only use facts from the job record. If there are no notes, say so and suggest what to confirm with the customer.",
      `Job ${job.job_number}: ${job.job_type} for ${job.customer} in ${job.suburb}. Status: ${job.status}. Value: $${job.value}. ` +
        `Booked: ${job.scheduled_for?.toISOString().slice(0, 10) ?? "not booked"}. Tech: ${job.technician ?? "unassigned"}.\n\nHistory (oldest first):\n${history}`,
    );
    return { text };
  } catch (e) {
    console.error("briefJob failed", { jobId, e });
    return { error: "Couldn't reach the AI. Try again." };
  }
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
