import Link from "next/link";
import { Suspense } from "react";
import { getStats, isSort, isStatus, listJobs, overdueJobs, STATUSES, type Status } from "@/lib/db";
import { date, money } from "@/lib/format";
import { STATUS_STYLE } from "@/lib/status";
import { StatusBadge } from "./components";
import { Filters } from "./filters";

const OPEN: Status[] = ["Scheduled", "In Progress", "On Hold"];
const today = new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "long", timeZone: "Australia/Melbourne" });

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <div className="shell py-6 sm:py-8">
      <Suspense fallback={<BoardSkeleton />}>
        <Board searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div aria-busy className="space-y-5">
      <div className="h-14 w-64 animate-pulse rounded-lg bg-line" />
      <div className="h-24 animate-pulse rounded-xl bg-line/70" />
      <div className="h-[480px] animate-pulse rounded-xl bg-line/70" />
    </div>
  );
}

async function Board({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const sp = await searchParams;
  const status = isStatus(sp.status) ? sp.status : undefined;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const sort = isSort(sp.sort) ? sp.sort : "newest";

  const [jobs, stats, overdue] = await Promise.all([listJobs({ status, q, sort }), getStats(), overdueJobs()]);
  const open = OPEN.reduce((a, s) => ({ count: a.count + stats[s].count, total: a.total + stats[s].total }), { count: 0, total: 0 });
  const all = STATUSES.reduce((n, s) => n + stats[s].count, 0);

  const href = (s?: Status) => {
    const p = new URLSearchParams();
    if (s) p.set("status", s);
    if (q) p.set("q", q);
    if (sort !== "newest") p.set("sort", sort);
    return p.size ? `/?${p}` : "/";
  };

  const summary: [string, number, number][] = [
    ["Open pipeline", open.total, open.count],
    ["In progress", stats["In Progress"].total, stats["In Progress"].count],
    ["On hold", stats["On Hold"].total, stats["On Hold"].count],
    ["Completed", stats.Completed.total, stats.Completed.count],
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
          <p className="mt-1 text-sm text-muted">{today.format(new Date())}</p>
        </div>
        <Suspense>
          <Filters />
        </Suspense>
      </div>

      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-line">
      <dl className="grid grid-cols-2 sm:grid-cols-4">
        {summary.map(([label, total, count], i) => (
          <div key={label} className={`px-4 py-3.5 sm:px-5 ${i % 2 ? "border-l border-line" : ""} ${i > 1 ? "border-t border-line sm:border-t-0" : ""} ${i === 2 ? "sm:border-l" : ""}`}>
            <dt className="text-xs font-medium text-muted">{label}</dt>
            <dd className="mt-1 font-mono text-lg font-semibold tracking-tight">{money(total)}</dd>
            <dd className="tabular text-xs text-muted">{count} {count === 1 ? "job" : "jobs"}</dd>
          </div>
        ))}
      </dl>
      {/* Where the money sits, by status. */}
      <div className="flex h-1.5 gap-px bg-line" role="img" aria-label={STATUSES.map((s) => `${s} ${money(stats[s].total)}`).join(", ")}>
        {STATUSES.map((s) => (
          <span key={s} className={STATUS_STYLE[s].dot} style={{ flexGrow: stats[s].total }} />
        ))}
      </div>
      </div>

      {overdue.length > 0 && (
        <div role="status" className="flex flex-col gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-red-200 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex gap-2.5 text-sm text-ink/80">
            <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-red-600 ring-4 ring-red-100" />
            <span>
              <strong className="font-semibold text-ink">{overdue.length} {overdue.length === 1 ? "job is" : "jobs are"} past the booked date</strong> and still
              marked Scheduled:{" "}
              {overdue.map((j, i) => (
                <span key={j.id}>
                  {i > 0 && ", "}
                  <Link href={`/jobs/${j.id}`} className="font-medium text-ink underline decoration-line underline-offset-2 hover:decoration-ink">{j.customer}</Link>
                </span>
              ))}
              .
            </span>
          </p>
          <Link
            href="/?status=Scheduled&sort=oldest"
            scroll={false}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-white px-3.5 text-sm font-medium text-ink ring-1 ring-line transition-[background-color,transform] duration-150 ease-out hover:bg-canvas active:scale-[0.97]"
          >
            Review overdue
          </Link>
        </div>
      )}

      <nav aria-label="Filter by status" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
        <ul className="flex w-max gap-1.5">
          {[undefined, ...STATUSES].map((s) => {
            const active = s === status;
            return (
              <li key={s ?? "all"}>
                <Link
                  href={href(s)}
                  scroll={false}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                    active ? "bg-ink text-white" : "text-ink/70 hover:bg-line/60 hover:text-ink"
                  }`}
                >
                  {s ?? "All"}
                  <span className={`tabular text-xs ${active ? "text-white/70" : "text-muted"}`}>{s ? stats[s].count : all}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-white px-6 py-14 text-center">
          <p className="font-semibold">No jobs match</p>
          <p className="mt-1 text-sm text-muted">
            Nothing for {q ? `“${q}”` : "this filter"}{status ? ` in ${status}` : ""}. Check the spelling or widen the filter.
          </p>
          <Link href="/" className="mt-5 inline-flex h-9 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white transition-[background-color,transform] duration-150 ease-out hover:bg-brand-deep active:scale-[0.97]">
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white ring-1 ring-line">
          <table className="w-full text-sm">
            <caption className="sr-only">{jobs.length} jobs</caption>
            <thead className="bg-canvas text-left text-xs font-medium text-muted">
              <tr className="border-b border-line">
                <th scope="col" className="hidden py-2.5 pl-5 font-medium md:table-cell">Job</th>
                <th scope="col" className="py-2.5 pl-4 font-medium md:pl-3">Customer</th>
                <th scope="col" className="hidden px-3 py-2.5 font-medium lg:table-cell">Job type</th>
                <th scope="col" className="hidden px-3 py-2.5 font-medium sm:table-cell">Status</th>
                <th scope="col" className="hidden px-3 py-2.5 font-medium xl:table-cell">Tech</th>
                <th scope="col" className="hidden px-3 py-2.5 font-medium sm:table-cell">Booked</th>
                <th scope="col" className="py-2.5 pr-4 pl-3 text-right font-medium sm:pr-5">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {jobs.map((j) => (
                <tr
                  key={j.id}
                  className="relative transition-colors duration-150 hover:bg-canvas has-[a:focus-visible]:bg-brand-soft has-[a:focus-visible]:outline-2 has-[a:focus-visible]:-outline-offset-2 has-[a:focus-visible]:outline-brand"
                >
                  <td className="hidden py-3 pl-5 font-mono text-xs text-muted md:table-cell">{j.job_number}</td>
                  <td className="py-3 pl-4 md:pl-3">
                    <Link href={`/jobs/${j.id}`} className="font-medium text-ink outline-none after:absolute after:inset-0">
                      {j.customer}
                    </Link>
                    <div className="mt-0.5 text-xs text-muted">
                      {j.suburb}
                      <span className="lg:hidden"> · {j.job_type}</span>
                    </div>
                    <div className="mt-2 flex gap-1.5 sm:hidden">
                      <StatusBadge status={j.status} />
                      {j.overdue && <Overdue />}
                    </div>
                  </td>
                  <td className="hidden px-3 py-3 text-ink/80 lg:table-cell">{j.job_type}</td>
                  <td className="hidden px-3 py-3 sm:table-cell"><StatusBadge status={j.status} /></td>
                  <td className="hidden px-3 py-3 xl:table-cell">
                    <span className="flex items-center gap-2 whitespace-nowrap text-ink/80">
                      <span aria-hidden className="grid size-6 place-items-center rounded-full bg-canvas text-[11px] font-semibold ring-1 ring-line">{j.technician?.[0] ?? "–"}</span>
                      {j.technician ?? "Unassigned"}
                    </span>
                  </td>
                  <td className="tabular hidden px-3 py-3 whitespace-nowrap text-ink/80 sm:table-cell">
                    {date(j.scheduled_for)}
                    {j.overdue && <span className="ml-2"><Overdue /></span>}
                  </td>
                  <td className="py-3 pr-4 pl-3 text-right font-mono font-medium whitespace-nowrap sm:pr-5">{money(j.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Overdue() {
  return <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200 ring-inset">Overdue</span>;
}
