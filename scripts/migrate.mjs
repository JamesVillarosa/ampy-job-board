// Creates tables and seeds 20 sample jobs if the table is empty. Safe to run on every deploy.
// Usage: node --env-file-if-exists=.env.local scripts/migrate.mjs [--reset]
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });

const jobs = [
  ["Sarah Mitchell", "Strathdale", "Switchboard upgrade", "Scheduled", 2850, "Liam"],
  ["Golden Square Bakery", "Golden Square", "Commercial fit-out", "In Progress", 18400, "Josh"],
  ["Tom & Priya Nguyen", "Strathfieldsaye", "EV charger install", "Completed", 1950, "Liam"],
  ["Kevin Doyle", "Kangaroo Flat", "Safety inspection", "Completed", 249, "Mia"],
  ["Marong Primary School", "Marong", "LED lighting upgrade", "Scheduled", 7200, "Josh"],
  ["Rachel Burke", "Huntly", "Ceiling fan install", "On Hold", 680, "Mia"],
  ["Daniel Ferris", "Epsom", "Split system install", "In Progress", 3400, "Ethan"],
  ["Bendigo Physio Co", "Bendigo", "Emergency callout", "Completed", 420, "Ethan"],
  ["Helen O'Brien", "Eaglehawk", "Smoke alarm compliance", "Scheduled", 365, "Mia"],
  ["Lockwood Vineyard", "Lockwood", "Sub-mains & shed wiring", "In Progress", 5650, "Josh"],
  ["Grace Thompson", "Woodvale", "Switchboard upgrade", "Scheduled", 3100, "Liam"],
  ["Goornong Pool Committee", "Goornong", "Commercial switchboard", "On Hold", 9800, "Josh"],
  ["Ben Carter", "Spring Gully", "Bathroom renovation wiring", "Completed", 2240, "Ethan"],
  ["Aisha Rahman", "North Bendigo", "Power point install", "Scheduled", 310, "Mia"],
  ["Mark & Jo Simmons", "Newstead", "Security lighting", "Cancelled", 890, "Liam"],
  ["Kangaroo Flat IGA", "Kangaroo Flat", "Emergency callout", "In Progress", 1150, "Ethan"],
  ["Peter Walsh", "Maiden Gully", "Underground locating", "Completed", 540, "Josh"],
  ["Emma Robinson", "Strathdale", "Rangehood & cooktop install", "Scheduled", 760, "Mia"],
  ["Castlemaine Rd Motors", "Kennington", "3-phase power upgrade", "On Hold", 6300, "Liam"],
  ["Lucy Hartmann", "White Hills", "Ducted heating service", "Scheduled", 495, "Ethan"],
];

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
    scheduled_for date,
    created_at timestamptz not null default now()
  )`;
await sql`
  create table if not exists job_events (
    id serial primary key,
    job_id int not null references jobs(id) on delete cascade,
    kind text not null check (kind in ('note','status')),
    body text not null,
    created_at timestamptz not null default now()
  )`;
await sql`create index if not exists job_events_job_id_idx on job_events(job_id, created_at desc)`;

const [{ count }] = await sql`select count(*)::int from jobs`;
if (count === 0) {
  const rows = jobs.map(([customer, suburb, job_type, status, value, technician], i) => ({
    job_number: `AMP-${1041 + i}`,
    customer, suburb, job_type, status, value, technician,
    // spread jobs across the last fortnight and the next fortnight
    scheduled_for: new Date(Date.now() + (i - 10) * 86400000).toISOString().slice(0, 10),
  }));
  const inserted = await sql`insert into jobs ${sql(rows)} returning id, status`;
  await sql`insert into job_events ${sql(inserted.map((j) => ({ job_id: j.id, kind: "status", body: `Job created as ${j.status}` })))}`;
  console.log(`Seeded ${rows.length} jobs`);
} else {
  console.log(`Schema ok, ${count} jobs present`);
}
await sql.end();
