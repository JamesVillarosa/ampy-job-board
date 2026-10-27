import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getStats, isSort, isStatus, listJobs, STATUSES, type Status } from "@/lib/db";
import { STATUS_STYLE } from "@/lib/status";
import { date, money } from "@/lib/format";
import { Eyebrow, StatusBadge } from "./components";
import { Filters } from "./filters";

const OPEN: Status[] = ["Scheduled", "In Progress", "On Hold"];
const today = new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "long", timeZone: "Australia/Melbourne" });

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<BoardSkeleton />}>
      <Board searchParams={searchParams} />
    </Suspense>
  );
}

function BoardSkeleton() {
  return (
    <div aria-busy className="space-y-10">
      <div className="brand-panel h-[360px] animate-pulse rounded-[28px]" />
      <div className="h-11 w-2/3 animate-pulse rounded-xl bg-line" />
      <div className="h-[480px] animate-pulse rounded-3xl bg-line/70" />
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
  const grand = STATUSES.reduce((n, s) => n + stats[s].total, 0) || 1;

  const href = (s?: Status) => {
    const p = new URLSearchParams();
    if (s) p.set("status", s);
    if (q) p.set("q", q);
    if (sort !== "newest") p.set("sort", sort);
    return p.size ? `/?${p}` : "/";
  };

  return (
    <div className="space-y-10 sm:space-y-14">
      {/* Hero: the one number the owner cares about, with value split by status. */}
      <section aria-labelledby="pipeline" className="brand-panel relative rounded-[28px] text-white">
        <div className="relative z-10 p-6 sm:p-10 lg:max-w-[58%] lg:p-12">
          <Eyebrow className="text-white/80">Today&apos;s board · {today.format(new Date())}</Eyebrow>
          <h1 id="pipeline" className="mt-4 text-[clamp(2.25rem,6vw,4.25rem)] leading-[0.95] font-black tracking-tight uppercase text-balance">
            <span className="tabular">{money(open.total)}</span>
            <span className="block text-white/85">in the pipeline</span>
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed font-medium text-white/90">
            {open.count} open jobs across Bendigo and surrounds. {stats["In Progress"].count} on the tools right now,{" "}
            {stats["On Hold"].count} waiting on the customer or parts.
          </p>

          <div className="mt-8 max-w-xl">
            <div className="flex h-3 overflow-hidden rounded-full bg-black/15" role="img" aria-label="Job value split by status">
              {STATUSES.map((s, i) => (
                <span key={s} className={`grow ${STATUS_STYLE[s].bar}`} style={{ width: `${(stats[s].total / grand) * 100}%`, ["--i" as string]: i }} />
              ))}
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              {STATUSES.map((s) => (
                <div key={s}>
                  <dt className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-white/75 uppercase">
                    <span aria-hidden className={`size-2 rounded-full ${STATUS_STYLE[s].bar}`} />
                    {s}
                  </dt>
                  <dd className="tabular mt-1 text-lg font-extrabold">{money(stats[s].total)}</dd>
                  <dd className="tabular text-xs font-medium text-white/70">{stats[s].count} {stats[s].count === 1 ? "job" : "jobs"}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <Image
          src="/van.webp"
          alt=""
          width={956}
          height={461}
          priority
          className="drive-in pointer-events-none absolute -right-6 -bottom-10 hidden w-[46%] max-w-[600px] drop-shadow-[0_24px_24px_rgb(60_20_0/0.35)] lg:block xl:-right-16"
        />
      </section>

      <section aria-labelledby="jobs-heading" className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Eyebrow className="text-brand">Job board</Eyebrow>
            <h2 id="jobs-heading" className="mt-1 text-3xl font-black tracking-tight uppercase">
              All jobs <span className="tabular text-muted/60">{all}</span>
            </h2>
          </div>
          <Suspense>
            <Filters />
          </Suspense>
        </div>

        <nav aria-label="Filter by status" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <ul className="flex w-max gap-2">
            {[undefined, ...STATUSES].map((s) => {
              const active = s === status;
              return (
                <li key={s ?? "all"}>
                  <Link
                    href={href(s)}
                    scroll={false}
                    aria-current={active ? "page" : undefined}
                    className={`flex h-10 items-center gap-2 rounded-full px-4 text-[13px] font-bold whitespace-nowrap ring-1 transition-[background-color,color,box-shadow,transform] duration-200 ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                      active ? "bg-ink text-white ring-ink" : "bg-white text-ink/75 ring-line hover:text-ink hover:ring-ink/25"
                    }`}
                  >
                    {s ?? "All"}
                    <span className={`tabular rounded-full px-1.5 text-[11px] ${active ? "bg-white/15" : "bg-paper text-muted"}`}>
                      {s ? stats[s].count : all}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {jobs.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-line bg-white px-6 py-16 text-center">
            <p className="text-lg font-extrabold uppercase">No jobs match</p>
            <p className="mt-1 text-sm text-muted">
              Nothing for {q ? `“${q}”` : "this filter"}{status ? ` in ${status}` : ""}. Check the spelling or widen the filter.
            </p>
            <Link href="/" className="mt-5 inline-flex h-10 items-center rounded-lg bg-brand px-5 text-[13px] font-bold tracking-wide text-white uppercase transition-[background-color,transform] duration-150 ease-out hover:bg-brand-deep active:scale-[0.97]">
              Clear filters
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl bg-white shadow-[0_1px_2px_rgb(60_30_10/0.06),0_8px_32px_-12px_rgb(60_30_10/0.12)] ring-1 ring-line">
            <table className="w-full text-sm">
              <caption className="sr-only">{jobs.length} jobs</caption>
              <thead className="text-left text-[11px] font-bold tracking-wider text-muted uppercase">
                <tr className="border-b border-line">
                  <th scope="col" className="hidden py-4 pl-6 md:table-cell">Job</th>
                  <th scope="col" className="py-4 pl-5 md:pl-4">Customer</th>
                  <th scope="col" className="hidden px-4 py-4 lg:table-cell">Job type</th>
                  <th scope="col" className="hidden px-4 py-4 sm:table-cell">Status</th>
                  <th scope="col" className="hidden px-4 py-4 sm:table-cell">Booked</th>
                  <th scope="col" className="py-4 pr-5 pl-4 text-right sm:pr-6">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {jobs.map((j, i) => (
                  <tr
                    key={j.id}
                    style={{ ["--i" as string]: i }}
                    className="rise group relative transition-colors duration-150 hover:bg-brand-soft/60 has-[a:focus-visible]:bg-brand-soft"
                  >
                    <td className="tabular hidden py-4 pl-6 text-xs font-semibold text-muted md:table-cell">{j.job_number}</td>
                    <td className="py-4 pl-5 md:pl-4">
                      <Link href={`/jobs/${j.id}`} className="font-bold text-ink outline-none after:absolute after:inset-0">
                        {j.customer}
                      </Link>
                      <div className="mt-0.5 text-xs font-medium text-muted">
                        {j.suburb}
                        <span className="lg:hidden"> · {j.job_type}</span>
                      </div>
                      <div className="mt-2 sm:hidden"><StatusBadge status={j.status} /></div>
                    </td>
                    <td className="hidden px-4 py-4 font-medium text-ink/80 lg:table-cell">{j.job_type}</td>
                    <td className="hidden px-4 py-4 sm:table-cell"><StatusBadge status={j.status} /></td>
                    <td className="tabular hidden px-4 py-4 font-medium whitespace-nowrap text-ink/70 sm:table-cell">{date(j.scheduled_for)}</td>
                    <td className="tabular py-4 pr-5 pl-4 text-right text-[15px] font-extrabold whitespace-nowrap sm:pr-6">
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
