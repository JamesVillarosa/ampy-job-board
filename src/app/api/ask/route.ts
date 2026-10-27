import { aiEnabled, claude } from "@/lib/ai";
import { listJobs } from "@/lib/db";

// "Ask the board": answers ops questions from the live job list.
// ponytail: sends every job as context; fine for hundreds of rows, switch to SQL tool-use past that.
export async function POST(req: Request) {
  if (!aiEnabled()) return Response.json({ error: "AI is off. Set ANTHROPIC_API_KEY to turn it on." }, { status: 503 });
  const { question } = await req.json().catch(() => ({}));
  if (typeof question !== "string" || !question.trim()) return Response.json({ error: "Ask a question first." }, { status: 400 });
  if (question.length > 300) return Response.json({ error: "Keep questions under 300 characters." }, { status: 400 });

  const jobs = await listJobs({ sort: "oldest" });
  const table = jobs
    .map((j) => [j.job_number, j.customer, j.suburb, j.job_type, j.status, j.value, j.scheduled_for?.toISOString().slice(0, 10) ?? "", j.technician ?? "", j.overdue ? "overdue" : ""].join(" | "))
    .join("\n");

  try {
    const answer = await claude(
      "You answer questions about Ampy Electrical's job board (Bendigo, AU) for office staff. Use only the jobs table provided. " +
        `Today is ${new Date().toISOString().slice(0, 10)}. Be brief: one or two sentences, or a short list with job numbers. Money in AUD. Plain text, no markdown headings. ` +
        "If the table can't answer it, say so.",
      `Jobs (number | customer | suburb | type | status | value | booked | tech | flag):\n${table}\n\nQuestion: ${question.trim()}`,
      500,
    );
    return Response.json({ answer });
  } catch (e) {
    console.error("ask failed", e);
    return Response.json({ error: "Couldn't reach the AI. Try again." }, { status: 502 });
  }
}
