import postgres from "postgres";

import { STATUSES, type Status } from "./status";
export { STATUSES, isStatus, type Status } from "./status";

export type Job = {
  id: number;
  job_number: string;
  customer: string;
  suburb: string;
  job_type: string;
  status: Status;
  value: number;
  technician: string | null;
  scheduled_for: Date | null;
};

export type JobEvent = { id: number; kind: "note" | "status"; body: string; created_at: Date };

// Reuse one pool across hot reloads in dev.
const g = globalThis as unknown as { sql?: postgres.Sql };
export const sql =
  g.sql ??
  postgres(process.env.DATABASE_URL!, {
    max: 5,
    types: { numeric: { to: 1700, from: [1700], serialize: String, parse: Number } },
  });
if (process.env.NODE_ENV !== "production") g.sql = sql;

const SORTS = {
  newest: sql`scheduled_for desc`,
  oldest: sql`scheduled_for asc`,
  value: sql`value desc`,
  customer: sql`customer asc`,
};
export type Sort = keyof typeof SORTS;
export const isSort = (s: unknown): s is Sort => typeof s === "string" && s in SORTS;

export async function listJobs({ status, q, sort }: { status?: Status; q?: string; sort: Sort }) {
  return sql<Job[]>`
    select * from jobs
    where true
      ${status ? sql`and status = ${status}` : sql``}
      ${q ? sql`and customer ilike ${"%" + q.replace(/[%_\\]/g, "\\$&") + "%"}` : sql``}
    order by ${SORTS[sort]}, id`;
}

export async function getStats() {
  const rows = await sql<{ status: Status; count: number; total: number }[]>`
    select status, count(*)::int as count, coalesce(sum(value), 0) as total from jobs group by status`;
  return Object.fromEntries(STATUSES.map((s) => [s, rows.find((r) => r.status === s) ?? { count: 0, total: 0 }])) as Record<
    Status,
    { count: number; total: number }
  >;
}

export async function getJob(id: number) {
  const [job] = await sql<Job[]>`select * from jobs where id = ${id}`;
  if (!job) return null;
  const events = await sql<JobEvent[]>`
    select id, kind, body, created_at from job_events where job_id = ${id} order by created_at desc, id desc`;
  return { job, events };
}
