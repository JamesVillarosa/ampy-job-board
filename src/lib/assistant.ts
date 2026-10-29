// Demo assistant: keyword rules over live jobs, no AI service. Same answers every time, nothing leaves the server.
// shortcut: matches keywords, not meaning; swap answer() for an LLM call if staff ask free-form questions it misses.
import type { Job, JobEvent, Status } from "./db";
import { date, money } from "./format";

type Row = Job & { overdue: boolean };

const OPEN: Status[] = ["Scheduled", "In Progress", "On Hold"];
// [AMP-1041](/jobs/2) is rendered as a link by the chat panel.
const line = (j: Row) => `[${j.job_number}](/jobs/${j.id}) ${j.customer} (${j.suburb}), ${j.job_type}, ${money(j.value)}${j.scheduled_for ? `, ${date(j.scheduled_for)}` : ""}`;
const list = (head: string, jobs: Row[], empty: string) => (jobs.length ? `${head}\n${jobs.map((j) => `• ${line(j)}`).join("\n")}` : empty);
const sum = (jobs: Row[]) => money(jobs.reduce((n, j) => n + Number(j.value), 0));
const has = (q: string, ...words: string[]) => words.some((w) => q.includes(w));

export const HELP =
  "I can answer from the live board. Try: what's overdue, who's on hold, what's on the tools, what's booked next, biggest open job, pipeline total, or name a suburb, customer, tech or job type.";

export function answer(question: string, jobs: Row[]): string {
  const q = question.toLowerCase();
  const open = jobs.filter((j) => OPEN.includes(j.status));
  const by = (s: Status) => jobs.filter((j) => j.status === s);

  // Contact details stay off the chat; the job page has the customer's number.
  if (has(q, "phone", "email", "e-mail", "mobile", "contact", "address")) return "I can't give out phone numbers, emails or addresses here. Open the job and use Call customer.";

  // Names first: "what's on in Strathdale?" should not fall into the generic "what's on" rule.
  const pick = (key: (j: Row) => string | null) =>
    [...new Set(jobs.map(key).filter((v): v is string => !!v))].find((v) => v.split(/\s+/).some((w) => w.length > 2 && new RegExp(`\\b${w.replace(/\W/g, "")}\\b`, "i").test(q)));
  const suburb = pick((j) => j.suburb);
  if (suburb) return list(`${suburb}:`, jobs.filter((j) => j.suburb === suburb).map(withStatus), `Nothing in ${suburb}.`);
  const tech = pick((j) => j.technician);
  if (tech) return list(`${tech}'s jobs:`, jobs.filter((j) => j.technician === tech).map(withStatus), `${tech} has no jobs.`);
  const customer = pick((j) => j.customer);
  if (customer) return list(`${customer}:`, jobs.filter((j) => j.customer === customer).map(withStatus), "");

  if (has(q, "overdue", "late", "missed", "slipped")) return list("Past the booked date and still Scheduled:", jobs.filter((j) => j.overdue), "Nothing overdue. Every Scheduled job is still in the future.");
  if (has(q, "hold", "waiting", "stuck", "parts")) return list(`On hold (${sum(by("On Hold"))}):`, by("On Hold"), "Nothing on hold.");
  if (has(q, "progress", "on the tools", "right now", "working")) return list("On the tools now:", by("In Progress"), "Nobody is on the tools right now.");
  if (has(q, "biggest", "largest", "most valuable", "highest", "top")) {
    const top = open.toSorted((a, b) => Number(b.value) - Number(a.value)).slice(0, 3);
    return list("Biggest open jobs:", top, "No open jobs.");
  }
  if (has(q, "total", "pipeline", "worth", "revenue", "how much")) {
    return `Open pipeline is ${sum(open)} across ${open.length} jobs: ${OPEN.map((s) => `${s} ${sum(by(s))} (${by(s).length})`).join(", ")}. Completed so far: ${sum(by("Completed"))}.`;
  }
  if (has(q, "cancel")) return list("Cancelled:", by("Cancelled"), "Nothing cancelled.");
  if (has(q, "complete", "done", "finished")) return list(`Completed (${sum(by("Completed"))}):`, by("Completed"), "Nothing completed yet.");
  if (has(q, "next", "upcoming", "booked", "scheduled", "week", "tomorrow", "today")) {
    const next = by("Scheduled").filter((j) => !j.overdue && j.scheduled_for).toSorted((a, b) => +a.scheduled_for! - +b.scheduled_for!).slice(0, 5);
    return list("Next bookings:", next, "Nothing booked ahead.");
  }
  if (has(q, "how many", "count", "status", "summary", "overview")) return `${jobs.length} jobs: ${["In Progress", "Scheduled", "On Hold", "Completed", "Cancelled"].map((s) => `${by(s as Status).length} ${s}`).join(", ")}.`;

  const type = pick((j) => j.job_type);
  if (type) return list(`${type} jobs:`, jobs.filter((j) => j.job_type === type).map(withStatus), "");
  return `I can't help with that. I only know the jobs on this board. ${HELP}`;
}

// Keep the status visible when a list mixes statuses.
const withStatus = (j: Row): Row => ({ ...j, job_type: `${j.job_type}, ${j.status}` });

// Handover brief in three plain sentences: where it stands, what the notes say (all of them), what to do next.
const clip = (t: string) => (t.length > 140 ? `${t.slice(0, 139).trimEnd()}…` : t).replace(/\s+/g, " ");
// Quote a note and end the sentence, without doubling a full stop the note already has.
const quoteEnd = (t: string) => `"${clip(t)}"${/[.!?…]$/.test(clip(t)) ? "" : "."}`;

export function brief(job: Job, events: JobEvent[]): string {
  const notes = events.filter((e) => e.kind === "note"); // newest first
  const changed = events.find((e) => e.kind === "status")?.created_at;
  const since = changed ? date(changed) : date(job.scheduled_for);
  const state: Record<Status, string> = {
    Scheduled: job.overdue
      ? `booked ${date(job.scheduled_for)} and still Scheduled, ${job.days_overdue} ${job.days_overdue === 1 ? "day" : "days"} overdue`
      : `booked for ${date(job.scheduled_for)}`,
    "In Progress": `in progress since ${since}`,
    "On Hold": `on hold since ${since}`,
    Completed: `completed ${since}`,
    Cancelled: `cancelled ${since}`,
  };
  const who = job.technician ? `with ${job.technician}` : "with no tech assigned";
  const where = `${job.job_type} for ${job.customer} in ${job.suburb} (${money(job.value)}), ${who}, ${state[job.status]}.`;

  const said = notes.length
    ? notes.length === 1
      ? `${notes[0].author ?? "Office"} noted on ${date(notes[0].created_at)}: ${quoteEnd(notes[0].body)}`
      : `Latest of ${notes.length} notes, from ${notes[0].author ?? "Office"} on ${date(notes[0].created_at)}: "${clip(notes[0].body)}"; earlier: ${notes
          .slice(1, -1)
          .map((n) => `"${clip(n.body)}", `)
          .join("")}${quoteEnd(notes.at(-1)!.body)}`
    : "No notes yet, so confirm access, parking and the exact scope with the customer before attending.";

  const next: Record<Status, string> = {
    Scheduled: job.overdue ? "Call the customer to rebook, or mark it In Progress if it's under way." : "Check stock before the day.",
    "In Progress": "Log anything the next tech needs before leaving site.",
    "On Hold": "Chase the customer or parts and set a date.",
    Completed: "Make sure it's invoiced.",
    Cancelled: "Nothing to action unless the customer comes back.",
  };
  return `${where} ${said} ${next[job.status]}`;
}
