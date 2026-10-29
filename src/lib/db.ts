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
  phone: string | null;
  overdue: boolean;
  days_overdue: number | null;
  ranks?: Record<Sort, number>;
};

export type JobEvent = { id: number; kind: "note" | "status"; body: string; author: string | null; created_at: Date };

// Reuse one pool across hot reloads in dev.
const g = globalThis as unknown as { sql?: postgres.Sql };
export const sql =
  g.sql ??
  postgres(process.env.DATABASE_URL!, {
    max: 5,
    // Neon's pooler (PgBouncer) can keep stale prepared plans after a schema reset; plain queries avoid that.
    prepare: false,
    types: { numeric: { to: 1700, from: [1700], serialize: String, parse: Number } },
  });
if (process.env.NODE_ENV !== "production") g.sql = sql;

// Today in Bendigo; the DB runs in UTC, so current_date is wrong for the first ten or so hours of each day.
const TODAY = sql`(now() at time zone 'Australia/Melbourne')::date`;
// Still "Scheduled" but the booked day has passed: someone forgot to update it, or the visit slipped.
export const OVERDUE = sql`(status = 'Scheduled' and scheduled_for < ${TODAY})`;
// Every job query returns these, so lists and the job page agree on what's overdue.
const COLUMNS = sql`*, ${OVERDUE} as overdue, case when ${OVERDUE} then ${TODAY} - scheduled_for end as days_overdue`;

const SORTS = {
  // Overdue, then on the tools, then upcoming bookings, then everything on hold, soonest first;
  // finished work (Completed, Cancelled) last, newest first.
  attention: sql`case when ${OVERDUE} then 0 when status = 'In Progress' then 1 when status = 'Scheduled' then 2 when status = 'On Hold' then 3 else 4 end, case when status in ('Scheduled', 'In Progress', 'On Hold') then scheduled_for end asc, scheduled_for desc`,
  newest: sql`scheduled_for desc`,
  oldest: sql`scheduled_for asc`,
  value: sql`value desc`,
  customer: sql`customer asc`,
};
export type Sort = keyof typeof SORTS;
export const isSort = (s: unknown): s is Sort => typeof s === "string" && s in SORTS;

export async function listJobs({ status, q, sort, overdue }: { status?: Status; q?: string; sort: Sort; overdue?: boolean }) {
  const like = q && "%" + q.replace(/[%_\\]/g, "\\$&") + "%";
  return sql<Job[]>`
    select ${COLUMNS},
      json_build_object(${sql.unsafe(Object.keys(SORTS).map((k, i) => `'${k}', rank_${i}`).join(", "))}) as ranks
    from (select *, ${Object.values(SORTS).map((o, i) => sql`row_number() over (order by ${o}, id) as ${sql(`rank_${i}`)}`).reduce((a, f) => sql`${a}, ${f}`)} from jobs) jobs
    where true
      ${status ? sql`and status = ${status}` : sql``}
      ${overdue ? sql`and ${OVERDUE}` : sql``}
      ${like ? sql`and (customer ilike ${like} or suburb ilike ${like} or job_type ilike ${like} or job_number ilike ${like})` : sql``}
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

export async function overdueJobs() {
  return sql<Job[]>`select ${COLUMNS} from jobs where ${OVERDUE} order by scheduled_for, id`;
}

// Next open bookings, for the run-sheet ticker.
export async function upcomingJobs(limit = 10) {
  return sql<Job[]>`
    select ${COLUMNS} from jobs
    where status in ('Scheduled', 'In Progress') and scheduled_for >= ${TODAY}
    order by scheduled_for, id limit ${limit}`;
}

export async function getJob(id: number) {
  const [job] = await sql<Job[]>`select ${COLUMNS} from jobs where id = ${id}`;
  if (!job) return null;
  const events = await sql<JobEvent[]>`
    select id, kind, body, author, created_at from job_events where job_id = ${id} and deleted_at is null order by created_at desc, id desc`;
  return { job, events };
}
