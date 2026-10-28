import { answer } from "@/lib/assistant";
import { listJobs } from "@/lib/db";

// "Ask the board": answers ops questions from the live job list (rule-based demo, see lib/assistant).
export async function POST(req: Request) {
  const { question } = await req.json().catch(() => ({}));
  if (typeof question !== "string" || !question.trim()) return Response.json({ error: "Ask a question first." }, { status: 400 });
  if (question.length > 300) return Response.json({ error: "Keep questions under 300 characters." }, { status: 400 });
  return Response.json({ answer: answer(question, await listJobs({ sort: "oldest" })) });
}
