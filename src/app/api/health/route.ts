import { connection } from "next/server";
import { sql } from "@/lib/db";

// Uptime monitors and Railway's healthcheck hit this. 503 means the DB is unreachable.
export async function GET() {
  await connection();
  const started = Date.now();
  try {
    const [{ jobs }] = await sql`select count(*)::int as jobs from jobs`;
    return Response.json({ ok: true, db: "up", jobs, latencyMs: Date.now() - started, commit: process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) ?? "local" });
  } catch (e) {
    console.error("healthcheck failed", e);
    return Response.json({ ok: false, db: "down" }, { status: 503 });
  }
}
