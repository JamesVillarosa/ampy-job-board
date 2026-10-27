import Link from "next/link";
import { Suspense } from "react";
import { getStats, isSort, isStatus, listJobs, STATUSES, type Status } from "@/lib/db";
import { date, money } from "@/lib/format";
import { StatusBadge } from "./components";
import { Filters } from "./filters";

const OPEN: Status[] = ["Scheduled", "In Progress", "On Hold"];

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-balance">Jobs</h1>
        <p className="mt-1 text-sm text-stone-500">Every job across the Bendigo region, live from the database.</p>
      </div>
      <Suspense fallback={<BoardSkeleton />}>
        <Board searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div aria-busy className="animate-pulse space-y-6">
      <div className="h-[98px] rounded-xl bg-stone-200/70" />
      <div className="h-10 w-2/3 rounded-lg bg-stone-200/70" />
      <div className="h-96 rounded-xl bg-stone-200/70" />
    </div>
  );
}

async function Board({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const sp = await searchParams;
  const status = isStatus(sp.status) ? sp.status : undefined;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const sort = isSort(sp.sort) ? sp.sort : "newest";

  const [jobs, stats] = await Promise.all([listJobs({ status, q, sort }), getStats()]);
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
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-stone-200 bg-stone-200 lg:grid-cols-4">
        <Stat label="Open pipeline" value={money(open.total)} sub={`${open.count} open jobs`} accent />
        <Stat label="In progress" value={String(stats["In Progress"].count)} sub={money(stats["In Progress"].total)} />
        <Stat label="On hold" value={String(stats["On Hold"].count)} sub={money(stats["On Hold"].total)} />
        <Stat label="Completed" value={money(stats.Completed.total)} sub={`${stats.Completed.count} jobs`} />
      </dl>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Filter by status" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <ul className="flex w-max gap-1 rounded-lg bg-stone-200/60 p-1">
            {[undefined, ...STATUSES].map((s) => {
              const active = s === status;
              return (
                <li key={s ?? "all"}>
                  <Link
                    href={href(s)}
                    scroll={false}
                    aria-current={active ? "page" : undefined}
                    className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-sm whitespace-nowrap transition-[background-color,color] duration-150 focus-visible:outline-2 focus-visible:outline-brand ${
                      active ? "bg-white font-medium text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    {s ?? "All"}
                    <span className="tabular text-xs text-stone-400">{s ? stats[s].count : all}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <Suspense>
          <Filters />
        </Suspense>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center">
          <p className="font-medium">No jobs match{q ? ` “${q}”` : ""}{status ? ` in ${status}` : ""}.</p>
          <Link href="/" className="mt-3 inline-block text-sm font-medium text-brand-deep underline-offset-4 hover:underline">
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <caption className="sr-only">{jobs.length} jobs</caption>
            <thead className="border-b border-stone-200 bg-stone-50 text-left text-xs font-medium text-stone-500">
              <tr>
                <th scope="col" className="hidden px-4 py-2.5 font-medium md:table-cell">Job</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Customer</th>
                <th scope="col" className="hidden px-4 py-2.5 font-medium lg:table-cell">Job type</th>
                <th scope="col" className="hidden px-4 py-2.5 font-medium sm:table-cell">Status</th>
                <th scope="col" className="hidden px-4 py-2.5 font-medium sm:table-cell">Date</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {jobs.map((j) => (
                <tr key={j.id} className="relative transition-colors duration-100 hover:bg-orange-50/40 has-[a:focus-visible]:bg-orange-50/60">
                  <td className="tabular hidden px-4 py-3 text-stone-500 md:table-cell">{j.job_number}</td>
                  <td className="px-4 py-3">
                    <Link href={`/jobs/${j.id}`} className="font-medium text-stone-900 outline-none after:absolute after:inset-0">
                      {j.customer}
                    </Link>
                    <div className="text-xs text-stone-500">
                      {j.suburb}
                      <span className="lg:hidden"> · {j.job_type}</span>
                    </div>
                    <div className="mt-1.5 sm:hidden"><StatusBadge status={j.status} /></div>
                  </td>
                  <td className="hidden px-4 py-3 text-stone-700 lg:table-cell">{j.job_type}</td>
                  <td className="hidden px-4 py-3 sm:table-cell"><StatusBadge status={j.status} /></td>
                  <td className="tabular hidden px-4 py-3 whitespace-nowrap text-stone-600 sm:table-cell">{date(j.scheduled_for)}</td>
                  <td className="tabular px-4 py-3 text-right font-medium whitespace-nowrap">{money(j.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className="bg-white px-4 py-4 sm:px-5">
      <dt className="text-xs font-medium text-stone-500">{label}</dt>
      <dd className={`tabular mt-1 font-display text-xl font-bold tracking-tight sm:text-2xl ${accent ? "text-brand-deep" : ""}`}>{value}</dd>
      <dd className="tabular mt-0.5 text-xs text-stone-500">{sub}</dd>
    </div>
  );
}
