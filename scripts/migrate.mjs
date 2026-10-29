// Creates tables and seeds 20 sample jobs if the table is empty. Safe to run on every deploy.
// Usage: node --env-file-if-exists=.env.local scripts/migrate.mjs [--reset]
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });

// [customer, suburb, job type, status, value, tech, booked (days from today)].
// Dates line up with status: done jobs in the past, live jobs today, four Scheduled jobs left overdue on purpose.
const jobs = [
  ["Sarah Mitchell", "Strathdale", "Switchboard upgrade", "Scheduled", 2850, "Liam", -12],
  ["Golden Square Bakery", "Golden Square", "Commercial fit-out", "In Progress", 18400, "Josh", -3],
  ["Tom & Priya Nguyen", "Strathfieldsaye", "EV charger install", "Completed", 1950, "Liam", -9],
  ["Kevin Doyle", "Kangaroo Flat", "Safety inspection", "Completed", 249, "Mia", -6],
  ["Marong Primary School", "Marong", "LED lighting upgrade", "Scheduled", 7200, "Josh", -8],
  ["Rachel Burke", "Huntly", "Ceiling fan install", "On Hold", 680, "Mia", -5],
  ["Daniel Ferris", "Epsom", "Split system install", "In Progress", 3400, "Ethan", 0],
  ["Bendigo Physio Co", "Bendigo", "Emergency callout", "Completed", 420, "Ethan", -2],
  ["Helen O'Brien", "Eaglehawk", "Smoke alarm compliance", "Scheduled", 365, "Mia", -4],
  ["Lockwood Vineyard", "Lockwood", "Sub-mains & shed wiring", "In Progress", 5650, "Josh", -1],
  ["Grace Thompson", "Woodvale", "Switchboard upgrade", "Scheduled", 3100, "Liam", -2],
  ["Goornong Pool Committee", "Goornong", "Commercial switchboard", "On Hold", 9800, "Josh", 6],
  ["Ben Carter", "Spring Gully", "Bathroom renovation wiring", "Completed", 2240, "Ethan", -11],
  ["Aisha Rahman", "North Bendigo", "Power point install", "Scheduled", 310, "Mia", 1],
  ["Mark & Jo Simmons", "Newstead", "Security lighting", "Cancelled", 890, "Liam", -7],
  ["Kangaroo Flat IGA", "Kangaroo Flat", "Emergency callout", "In Progress", 1150, "Ethan", 0],
  ["Peter Walsh", "Maiden Gully", "Underground locating", "Completed", 540, "Josh", -13],
  ["Emma Robinson", "Strathdale", "Rangehood & cooktop install", "Scheduled", 760, "Mia", 3],
  ["Castlemaine Rd Motors", "Kennington", "3-phase power upgrade", "On Hold", 6300, "Liam", 9],
  ["Lucy Hartmann", "White Hills", "Ducted heating service", "Scheduled", 495, "Ethan", 5],
];
// ACMA's reserved fictitious mobile numbers, so a demo tap never rings a real person.
const PHONES = ["0491 570 006", "0491 570 156", "0491 570 157", "0491 570 158", "0491 570 159", "0491 570 110", "0491 570 313", "0491 570 737"];

if (process.argv.includes("--reset")) await sql`drop table if exists job_events, jobs`;

await sql`
  create table if not exists jobs (
    id serial primary key,
    job_number text not null unique,
    customer text not null,
    suburb text not null,
    job_type text not null,
    status text not null check (status in ('Scheduled','In Progress','On Hold','Completed','Cancelled')),
    value numeric(10,2) not null check (value >= 0),
    technician text,
    phone text,
    scheduled_for date,
    created_at timestamptz not null default now()
  )`;
await sql`
  create table if not exists job_events (
    id serial primary key,
    job_id int not null references jobs(id) on delete cascade,
    kind text not null check (kind in ('note','status')),
    body text not null,
    author text,
    deleted_at timestamptz,
    created_at timestamptz not null default now()
  )`;
// Columns added after the first deploy.
await sql`alter table jobs add column if not exists phone text`;
await sql`alter table job_events add column if not exists author text`;
await sql`alter table job_events add column if not exists deleted_at timestamptz`;
await sql`create index if not exists job_events_job_id_idx on job_events(job_id, created_at desc)`;

const [{ count }] = await sql`select count(*)::int from jobs`;
if (count === 0) {
  // Today in Bendigo, not UTC, so "today" matches what the team sees.
  const today = new Date(new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Melbourne" }));
  const DAY = 86400000;
  const rows = jobs.map(([customer, suburb, job_type, status, value, technician, days], i) => {
    const booked = +today + days * DAY;
    return {
      job_number: `AMP-${1041 + i}`,
      customer, suburb, job_type, status, value, technician,
      phone: PHONES[i % PHONES.length],
      scheduled_for: new Date(booked).toISOString().slice(0, 10),
      // Booked in a week ahead, or a few days ago for future work: never created after the booked day.
      created_at: new Date(Math.min(booked - 7 * DAY, Date.now() - 3 * DAY)),
    };
  });
  const inserted = await sql`insert into jobs ${sql(rows)} returning id, status, scheduled_for, created_at`;
  // History: created as Scheduled, then moved to its current status on the booked day (never in the future).
  const history = inserted.flatMap((j) => [
    { job_id: j.id, kind: "status", body: "Job created as Scheduled", author: "Office", created_at: j.created_at },
    ...(j.status === "Scheduled"
      ? []
      : [{ job_id: j.id, kind: "status", body: `Scheduled → ${j.status}`, author: "Office", created_at: new Date(Math.min(+j.scheduled_for, Date.now() - 3600000)) }]),
  ]);
  await sql`insert into job_events ${sql(history)}`;
  console.log(`Seeded ${rows.length} jobs`);
} else {
  console.log(`Schema ok, ${count} jobs present`);
}
await sql.end();
