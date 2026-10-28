import Link from "next/link";
import { Suspense } from "react";
import { getStats, isSort, isStatus, listJobs, overdueJobs, STATUSES, type Status } from "@/lib/db";
import { STATUS_STYLE } from "@/lib/status";
import { date, money } from "@/lib/format";
import { StatusBadge, Tech } from "./components";
import { Filters } from "./filters";

const OPEN: Status[] = ["In Progress", "Scheduled", "On Hold"];
// Shades that read on the orange panel.
const SPLIT: Partial<Record<Status, string>> = { "In Progress": "bg-white", Scheduled: "bg-white/50", "On Hold": "bg-amber-200" };
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

  return (
    <div className="space-y-8 sm:space-y-10">
      <section aria-labelledby="today" className="brand-panel overflow-hidden rounded-3xl text-white shadow-[0_24px_48px_-28px_rgb(160_50_0/0.7)]">
        <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.25fr_1fr] lg:gap-10">
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-white/85">
              {greeting()}, team · {today.format(new Date())}
            </p>
            <h1 id="today" className="mt-2 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
              Here’s the day at a glance
            </h1>
            <ul className="mt-6 grid grid-cols-3 gap-2.5 sm:gap-3">
              {(
                [
                  ["In Progress", "On the tools"],
                  ["Scheduled", "Booked in"],
                  ["On Hold", "Waiting"],
                ] as const
              ).map(([s, label]) => (
                <li key={s}>
                  <Link
                    href={href(s)}
                    scroll={false}
                    className="block rounded-2xl bg-white/12 p-3 ring-1 ring-white/25 transition-[background-color,transform] duration-200 ease-out hover:bg-white/20 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:p-4"
                  >
                    <span className="tabular block text-3xl font-extrabold sm:text-4xl">{stats[s].count}</span>
                    <span className="mt-1 block text-xs font-semibold text-white/90 sm:text-sm">{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
            {/* Where the open work sits. */}
            <div className="mt-auto pt-6">
              <p className="text-sm font-medium text-white/90">
                <span className="tabular text-lg font-extrabold text-white">{money(open.total)}</span> of open work across {open.count} jobs
              </p>
              <div className="mt-3 flex h-2.5 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={OPEN.map((s) => `${s} ${money(stats[s].total)}`).join(", ")}>
                {OPEN.map((s) => (
                  <span key={s} className={SPLIT[s]} style={{ flexGrow: stats[s].total }} />
                ))}
              </div>
              <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold text-white/90">
                {OPEN.map((s) => (
                  <li key={s} className="flex items-center gap-1.5">
                    <span aria-hidden className={`size-2 rounded-full ${SPLIT[s]}`} />
                    {s} <span className="tabular text-white">{money(stats[s].total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div role="status" className="rounded-2xl bg-white p-5 text-ink shadow-[0_12px_32px_-16px_rgb(60_20_0/0.5)]">
            {overdue.length > 0 ? (
              <>
                <div className="flex items-start gap-3">
                  <span aria-hidden className="mt-1.5 size-2.5 shrink-0 rounded-full bg-red-500 ring-4 ring-red-100" />
                  <div>
                    <h2 className="font-bold">Needs a follow-up</h2>
                    <p className="mt-0.5 text-sm text-muted">
                      {overdue.length} {overdue.length === 1 ? "job is" : "jobs are"} past the booked date and still marked Scheduled.
                    </p>
                  </div>
                </div>
                <ul className="mt-4 divide-y divide-line">
                  {overdue.slice(0, 3).map((j) => (
                    <li key={j.id}>
                      <Link href={`/jobs/${j.id}`} className="group flex items-center justify-between gap-3 py-2.5">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold group-hover:text-brand-deep">{j.customer}</span>
                          <span className="block text-xs text-muted">{j.suburb} · booked {date(j.scheduled_for)}</span>
                        </span>
                        <span aria-hidden className="text-muted transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-brand">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/?status=Scheduled&sort=oldest"
                  scroll={false}
                  className="mt-3 flex h-10 items-center justify-center rounded-xl bg-ink text-sm font-bold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-ink/85 active:scale-[0.97]"
                >
                  Review overdue
                </Link>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center py-6 text-center">
                <span aria-hidden className="grid size-10 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-700">✓</span>
                <h2 className="mt-3 font-bold">All caught up</h2>
                <p className="mt-1 text-sm text-muted">No jobs are past their booked date.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="jobs-heading" className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <h2 id="jobs-heading" className="text-2xl font-extrabold tracking-tight">
            All jobs <span className="tabular text-muted/60">{all}</span>
          </h2>
          <Suspense>
            <Filters />
          </Suspense>
        </div>

        <nav aria-label="Filter by status" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
          <ul className="flex w-max gap-2">
            {[undefined, ...STATUSES].map((s) => {
              const active = s === status;
              return (
                <li key={s ?? "all"}>
                  <Link
                    href={href(s)}
                    scroll={false}
                    aria-current={active ? "page" : undefined}
                    className={`flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap ring-1 transition-[background-color,color,box-shadow,transform] duration-200 ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                      active ? "bg-ink text-white ring-ink" : "bg-white text-ink/75 ring-line hover:text-ink hover:ring-ink/25"
                    }`}
                  >
                    {s && <span aria-hidden className={`size-2 rounded-full ${STATUS_STYLE[s].dot}`} />}
                    {s ?? "All"}
                    <span className={`tabular rounded-full px-1.5 text-xs ${active ? "bg-white/15" : "bg-canvas text-muted"}`}>{s ? stats[s].count : all}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {jobs.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-line bg-white px-6 py-14 text-center">
            <p className="text-lg font-bold">No jobs match</p>
            <p className="mt-1 text-sm text-muted">
              Nothing for {q ? `“${q}”` : "this filter"}{status ? ` in ${status}` : ""}. Check the spelling or show everything.
            </p>
            <Link href="/" className="mt-5 inline-flex h-10 items-center rounded-xl bg-brand px-5 text-sm font-bold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-brand-deep active:scale-[0.97]">
              Clear filters
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgb(60_30_10/0.05),0_12px_32px_-16px_rgb(60_30_10/0.15)] ring-1 ring-line">
            <table className="w-full text-sm">
              <caption className="sr-only">{jobs.length} jobs</caption>
              <thead className="text-left text-xs font-semibold text-muted">
                <tr className="border-b border-line">
                  <th scope="col" className="py-3.5 pl-5 sm:pl-6">Customer</th>
                  <th scope="col" className="hidden px-4 py-3.5 lg:table-cell">Job</th>
                  <th scope="col" className="hidden px-4 py-3.5 sm:table-cell">Status</th>
                  <th scope="col" className="hidden px-4 py-3.5 xl:table-cell">Tech</th>
                  <th scope="col" className="hidden px-4 py-3.5 md:table-cell">Booked</th>
                  <th scope="col" className="py-3.5 pr-5 pl-4 text-right sm:pr-6">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {jobs.map((j) => (
                  <tr
                    key={j.id}
                    className="group relative transition-colors duration-150 hover:bg-brand-soft/50 has-[a:focus-visible]:bg-brand-soft has-[a:focus-visible]:outline-2 has-[a:focus-visible]:-outline-offset-2 has-[a:focus-visible]:outline-brand"
                  >
                    <td className="py-4 pl-5 sm:pl-6">
                      <Link href={`/jobs/${j.id}`} className="font-bold text-ink outline-none after:absolute after:inset-0">
                        {j.customer}
                      </Link>
                      <div className="mt-0.5 text-xs font-medium text-muted">
                        {j.suburb}
                        <span className="lg:hidden"> · {j.job_type}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5 sm:hidden">
                        <StatusBadge status={j.status} />
                        {j.overdue && <Overdue />}
                      </div>
                    </td>
                    <td className="hidden px-4 py-4 lg:table-cell">
                      <span className="font-medium text-ink/85">{j.job_type}</span>
                      <span className="tabular block text-xs text-muted">{j.job_number}</span>
                    </td>
                    <td className="hidden px-4 py-4 sm:table-cell">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={j.status} />
                        {j.overdue && <Overdue />}
                      </div>
                    </td>
                    <td className="hidden px-4 py-4 text-ink/85 xl:table-cell"><Tech name={j.technician} /></td>
                    <td className="tabular hidden px-4 py-4 font-medium whitespace-nowrap text-ink/75 md:table-cell">{date(j.scheduled_for)}</td>
                    <td className="tabular py-4 pr-5 pl-4 text-right text-[15px] font-bold whitespace-nowrap sm:pr-6">
                      <span className="inline-flex items-center gap-2">
                        {money(j.value)}
                        <span aria-hidden className="hidden text-brand opacity-0 transition-[opacity,transform] duration-200 ease-out group-hover:translate-x-0.5 group-hover:opacity-100 sm:inline">→</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Overdue() {
  return <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200 ring-inset">Overdue</span>;
}
