import Link from "next/link";
import { Suspense } from "react";
import { getStats, isSort, isStatus, listJobs, overdueJobs, STATUSES, type Job, type Status } from "@/lib/db";
import { STATUS_STYLE } from "@/lib/status";
import { date, money } from "@/lib/format";
import { StatusBadge, Tech } from "./components";
import { Filters } from "./filters";
import { KeepSort, Sorted } from "./sorted";

const OPEN: Status[] = ["In Progress", "Scheduled", "On Hold"];
const today = new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "long", timeZone: "Australia/Melbourne" });
const hour = new Intl.DateTimeFormat("en-AU", { hour: "numeric", hourCycle: "h23", timeZone: "Australia/Melbourne" });
const greeting = () => {
  const h = Number(hour.format(new Date()));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

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
    <div aria-busy className="space-y-8">
      <div className="brand-panel h-72 animate-pulse rounded-3xl" />
      <div className="h-[480px] animate-pulse rounded-2xl bg-line/70" />
    </div>
  );
}

async function Board({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const sp = await searchParams;
  const overdueOnly = sp.overdue === "1";
  const status = !overdueOnly && isStatus(sp.status) ? sp.status : undefined;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const sort = isSort(sp.sort) ? sp.sort : "attention";

  const [jobs, stats, overdue] = await Promise.all([listJobs({ status, q, sort, overdue: overdueOnly }), getStats(), overdueJobs()]);
  const open = OPEN.reduce((a, s) => ({ count: a.count + stats[s].count, total: a.total + stats[s].total }), { count: 0, total: 0 });
  const all = STATUSES.reduce((n, s) => n + stats[s].count, 0);

  const href = (filter?: Status | "overdue") => {
    const p = new URLSearchParams();
    if (filter === "overdue") p.set("overdue", "1");
    else if (filter) p.set("status", filter);
    if (q) p.set("q", q);
    return p.size ? `/?${p}` : "/";
  };
  const chips: [Status | "overdue" | undefined, string, string | null, number][] = [
    [undefined, "All", null, all],
    ["overdue", "Overdue", "bg-red-500", overdue.length],
    ...STATUSES.map((s): [Status, string, string, number] => [s, s, STATUS_STYLE[s].dot, stats[s].count]),
  ];
  const activeChip = overdueOnly ? "overdue" : status;
  const shown = overdue.length > 4 ? overdue.slice(0, 3) : overdue;

  return (
    <div className="space-y-8 sm:space-y-10">
      <section aria-labelledby="today" className="brand-panel overflow-hidden rounded-3xl text-white shadow-[0_24px_48px_-28px_rgb(160_50_0/0.7)]">
        <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.25fr_1fr] lg:gap-10">
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-white">
              {greeting()}, team · {today.format(new Date())}
            </p>
            <h1 id="today" className="mt-2 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
              Here’s the day at a glance
            </h1>
            <ul className="mt-6 grid grid-cols-3 gap-2.5 sm:gap-3">
              {OPEN.map((s) => (
                <li key={s}>
                  <Link
                    href={`${href(s)}#jobs`}
                    className="block rounded-2xl bg-white/15 p-3 ring-1 ring-white/30 transition-[background-color,transform] duration-200 ease-out hover:bg-white/25 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:p-4"
                  >
                    <span className="tabular block font-display text-3xl font-extrabold sm:text-4xl">{stats[s].count}</span>
                    <span className="mt-1 block text-sm font-semibold">{s}</span>
                  </Link>
                </li>
              ))}
            </ul>
            {/* Where the open work sits, in the same colours as the status chips below. */}
            <div className="mt-auto pt-6">
              <div className="rounded-2xl bg-white p-4 text-ink shadow-[0_12px_32px_-16px_rgb(60_20_0/0.5)]">
                <p className="text-sm font-semibold text-muted">
                  <span className="tabular font-display text-xl font-extrabold text-ink">{money(open.total)}</span> of open work across {open.count} jobs
                </p>
                <div className="mt-3 flex h-2.5 gap-1" role="img" aria-label={OPEN.map((s) => `${s} ${money(stats[s].total)}`).join(", ")}>
                  {OPEN.map((s) => (
                    <span key={s} className={`rounded-full ${STATUS_STYLE[s].dot}`} style={{ flexGrow: stats[s].total }} />
                  ))}
                </div>
                <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm font-semibold">
                  {OPEN.map((s) => (
                    <li key={s} className="flex items-center gap-2">
                      <span aria-hidden className={`size-2.5 rounded-full ${STATUS_STYLE[s].dot}`} />
                      {s} <span className="tabular text-muted">{money(stats[s].total)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div role="status" className="rounded-2xl bg-white p-5 text-ink shadow-[0_12px_32px_-16px_rgb(60_20_0/0.5)]">
            {overdue.length > 0 ? (
              <>
                <div className="flex items-start gap-3">
                  <span aria-hidden className="mt-1.5 size-2.5 shrink-0 rounded-full bg-red-500 ring-4 ring-red-100" />
                  <div>
                    <h2 className="text-lg font-bold">Needs a follow-up</h2>
                    <p className="mt-0.5 text-sm text-muted">
                      {overdue.length} {overdue.length === 1 ? "job is" : "jobs are"} past the booked date and still marked Scheduled.
                    </p>
                  </div>
                </div>
                <ul className="mt-3 divide-y divide-line">
                  {shown.map((j) => (
                    <li key={j.id}>
                      <Link href={`/jobs/${j.id}`} className="group flex min-h-12 items-center justify-between gap-3 py-2">
                        <span className="min-w-0">
                          <span className="block truncate font-semibold group-hover:text-brand-deep">{j.customer}</span>
                          <span className="block text-sm text-muted">
                            {j.suburb} · {j.days_overdue} {j.days_overdue === 1 ? "day" : "days"} late
                          </span>
                        </span>
                        <span aria-hidden className="text-muted transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-brand">→</span>
                      </Link>
                    </li>
                  ))}
                  {shown.length < overdue.length && (
                    <li className="py-2 text-sm font-semibold text-muted">+ {overdue.length - shown.length} more</li>
                  )}
                </ul>
                <Link
                  href="/?overdue=1#jobs"
                  className="mt-3 flex h-11 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-brand-deep active:scale-[0.97]"
                >
                  Review overdue
                </Link>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center py-6 text-center">
                <span aria-hidden className="grid size-10 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-700">✓</span>
                <h2 className="mt-3 text-lg font-bold">All caught up</h2>
                <p className="mt-1 text-sm text-muted">No jobs are past their booked date.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="jobs" aria-labelledby="jobs-heading" className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <h2 id="jobs-heading" className="text-2xl font-extrabold tracking-tight">
            {overdueOnly ? "Overdue jobs" : "All jobs"} <span className="tabular text-muted/60">{jobs.length}</span>
          </h2>
          <Suspense>
            <Filters />
          </Suspense>
        </div>

        <nav aria-label="Filter by status" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
          <ul className="flex w-max gap-2">
            {chips.map(([key, label, dot, count]) => {
              const active = key === activeChip;
              return (
                <li key={label}>
                  <KeepSort
                    href={href(key)}
                    scroll={false}
                    aria-current={active ? "page" : undefined}
                    className={`flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap ring-1 transition-[background-color,color,box-shadow,transform] duration-200 ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                      active ? "bg-ink text-white ring-ink" : "bg-white text-ink/80 ring-line hover:text-ink hover:ring-ink/25"
                    }`}
                  >
                    {dot && <span aria-hidden className={`size-2 rounded-full ${dot}`} />}
                    {label}
                    <span className={`tabular rounded-full px-1.5 text-xs ${active ? "bg-white/15" : "bg-canvas text-muted"}`}>{count}</span>
                  </KeepSort>
                </li>
              );
            })}
          </ul>
        </nav>

        <div id="results">
          {jobs.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-line bg-white px-6 py-14 text-center">
              <p className="font-display text-lg font-bold">No jobs match</p>
              <p className="mt-1 text-muted">
                Nothing for {q ? `“${q}”` : "this filter"}{status ? ` in ${status}` : ""}. Check the spelling or show everything.
              </p>
              <Link href="/" className="mt-5 inline-flex h-11 items-center rounded-xl bg-brand px-5 text-sm font-bold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-brand-deep active:scale-[0.97]">
                Clear filters
              </Link>
            </div>
          ) : (
            <>
              {/* Phones: one card per job, the whole card is the tap target. */}
              <Sorted as="ul" ranks={jobs.map((j) => j.ranks!)} className="space-y-2.5 md:hidden">
                {jobs.map((j) => (
                  <li key={j.id}>
                    <Link href={`/jobs/${j.id}`} className="block rounded-2xl bg-white p-4 ring-1 ring-line transition-[transform,box-shadow] duration-150 ease-out active:scale-[0.98]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold">{j.customer}</p>
                          <p className="mt-0.5 text-sm text-muted">{j.suburb} · {j.job_type}</p>
                        </div>
                        <p className="tabular shrink-0 font-display font-bold">{money(j.value)}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <StatusBadge status={j.status} daysOverdue={j.days_overdue} />
                        <span className="tabular text-sm text-muted">{date(j.scheduled_for)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </Sorted>
              <JobTable jobs={jobs} />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function JobTable({ jobs }: { jobs: Job[] }) {
  return (
    <div className="hidden overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgb(60_30_10/0.05),0_12px_32px_-16px_rgb(60_30_10/0.15)] ring-1 ring-line md:block">
      <table className="w-full text-[15px]">
        <caption className="sr-only">{jobs.length} jobs</caption>
        <thead className="text-left text-sm font-semibold text-muted">
          <tr className="border-b border-line">
            <th scope="col" className="py-3.5 pl-6">Customer</th>
            <th scope="col" className="hidden px-4 py-3.5 lg:table-cell">Job</th>
            <th scope="col" className="px-4 py-3.5">Status</th>
            <th scope="col" className="hidden px-4 py-3.5 xl:table-cell">Tech</th>
            <th scope="col" className="px-4 py-3.5">Booked</th>
            <th scope="col" className="py-3.5 pr-6 pl-4 text-right">Value</th>
          </tr>
        </thead>
        <Sorted as="tbody" ranks={jobs.map((j) => j.ranks!)} className="divide-y divide-line/70">
          {jobs.map((j) => (
            <tr
              key={j.id}
              className="group relative transition-colors duration-150 hover:bg-brand-soft/50 has-[a:focus-visible]:bg-brand-soft has-[a:focus-visible]:outline-2 has-[a:focus-visible]:-outline-offset-2 has-[a:focus-visible]:outline-brand"
            >
              <td className="py-4 pl-6">
                <Link href={`/jobs/${j.id}`} className="font-bold text-ink outline-none after:absolute after:inset-0">
                  {j.customer}
                </Link>
                <div className="mt-0.5 text-sm text-muted">
                  {j.suburb}
                  <span className="lg:hidden"> · {j.job_type}</span>
                </div>
              </td>
              <td className="hidden px-4 py-4 lg:table-cell">
                <span className="text-ink/90">{j.job_type}</span>
                <span className="tabular block text-sm text-muted">{j.job_number}</span>
              </td>
              <td className="px-4 py-4"><StatusBadge status={j.status} daysOverdue={j.days_overdue} /></td>
              <td className="hidden px-4 py-4 text-ink/90 xl:table-cell"><Tech name={j.technician} /></td>
              <td className="tabular px-4 py-4 whitespace-nowrap text-ink/80">{date(j.scheduled_for)}</td>
              <td className="tabular py-4 pr-6 pl-4 text-right font-display font-bold whitespace-nowrap">
                <span className="inline-flex items-center gap-2">
                  {money(j.value)}
                  <span aria-hidden className="text-brand opacity-0 transition-[opacity,transform] duration-200 ease-out group-hover:translate-x-0.5 group-hover:opacity-100">→</span>
                </span>
              </td>
            </tr>
          ))}
        </Sorted>
      </table>
    </div>
  );
}
