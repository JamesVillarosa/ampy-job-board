import { connection } from "next/server";
import { getStats, overdueJobs, upcomingJobs } from "@/lib/db";
import { date, money } from "@/lib/format";

// Morning digest for automations: point a cron, n8n or Zapier at this and post `text` to Slack or SMS.
export async function GET() {
  await connection();
  const [stats, overdue, upcoming] = await Promise.all([getStats(), overdueJobs(), upcomingJobs(5)]);
  const open = (["Scheduled", "In Progress", "On Hold"] as const).reduce((a, s) => ({ count: a.count + stats[s].count, total: a.total + stats[s].total }), { count: 0, total: 0 });
  const pick = (j: (typeof overdue)[number]) => ({ job: j.job_number, customer: j.customer, suburb: j.suburb, booked: date(j.scheduled_for) });

  const text = [
    `Ampy board: ${open.count} open jobs, ${money(open.total)} in the pipeline.`,
    overdue.length ? `Overdue (${overdue.length}): ${overdue.map((j) => `${j.job_number} ${j.customer}`).join(", ")}.` : "Nothing overdue.",
    upcoming.length ? `Next up: ${upcoming.map((j) => `${date(j.scheduled_for)} ${j.customer} (${j.suburb})`).join("; ")}.` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return Response.json({ open, overdue: overdue.map(pick), upcoming: upcoming.map(pick), text });
}
