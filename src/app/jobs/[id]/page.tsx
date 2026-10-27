import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getJob } from "@/lib/db";
import { STATUS_STYLE } from "@/lib/status";
import { date, dateTime, money } from "@/lib/format";
import { Eyebrow } from "../../components";
import { NoteForm, StatusForm } from "./forms";

export async function generateMetadata({ params }: PageProps<"/jobs/[id]">) {
  const data = await load((await params).id);
  return { title: data ? `${data.job.job_number} ${data.job.customer} · Ampy` : "Job not found · Ampy" };
}

async function load(id: string) {
  return /^\d{1,9}$/.test(id) ? getJob(Number(id)) : null;
}

export default function JobPage({ params }: PageProps<"/jobs/[id]">) {
  return (
    <Suspense fallback={<div aria-busy className="brand-panel h-72 animate-pulse rounded-[28px]" />}>
      <JobDetail params={params} />
    </Suspense>
  );
}

async function JobDetail({ params }: Pick<PageProps<"/jobs/[id]">, "params">) {
  const data = await load((await params).id);
  if (!data) notFound();
  const { job, events } = data;
  const notes = events.filter((e) => e.kind === "note").length;

  return (
    <div className="space-y-8">
      <Link href="/" className="group inline-flex items-center gap-2 text-[13px] font-bold tracking-wide text-ink/70 uppercase transition-colors hover:text-brand">
        <span aria-hidden className="transition-transform duration-200 ease-out group-hover:-translate-x-0.5">←</span> All jobs
      </Link>

      <section className="brand-panel rounded-[28px] p-6 text-white sm:p-10">
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <Eyebrow className="text-white/80">
              <span className="tabular">{job.job_number}</span> · {job.job_type}
            </Eyebrow>
            <h1 className="mt-3 text-[clamp(2rem,5vw,3.5rem)] leading-[0.95] font-black tracking-tight uppercase text-balance">{job.customer}</h1>
            <p className="mt-3 flex items-center gap-1.5 text-[15px] font-semibold text-white/90">
              <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" /></svg>
              {job.suburb}, VIC
            </p>
          </div>
          <div className="shrink-0 lg:text-right">
            <p className="text-[11px] font-bold tracking-wider text-white/80 uppercase">Job value</p>
            <p className="tabular text-5xl font-black tracking-tight">{money(job.value)}</p>
          </div>
        </div>
        <div className="relative z-10 mt-8 border-t border-white/20 pt-6">
          <StatusForm jobId={job.id} current={job.status} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="activity" className="rounded-3xl bg-white p-5 ring-1 ring-line sm:p-8">
          <div className="flex items-baseline justify-between">
            <h2 id="activity" className="text-xl font-black tracking-tight uppercase">Activity</h2>
            <span className="tabular text-xs font-semibold text-muted">{notes} {notes === 1 ? "note" : "notes"}</span>
          </div>
          <div className="mt-5">
            <NoteForm jobId={job.id} />
          </div>
          <ol className="mt-8">
            {events.map((e, i) => (
              <li key={e.id} data-kind={e.kind} style={{ ["--i" as string]: i }} className="rise group/item relative flex gap-4 pb-6 last:pb-0">
                <span aria-hidden className="absolute top-7 bottom-1 left-[11px] w-px bg-line group-last/item:hidden" />
                <span aria-hidden className={`relative mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg ${e.kind === "note" ? "bg-brand text-white" : "bg-paper ring-1 ring-line"}`}>
                  {e.kind === "note" ? (
                    <svg viewBox="0 0 20 20" className="size-3.5" fill="currentColor"><path d="M4 3h12a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3v-3H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /></svg>
                  ) : (
                    <span className={`size-2 rounded-full ${STATUS_STYLE[statusOf(e.body)].dot}`} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  {e.kind === "note" ? (
                    <p className="text-[15px] leading-relaxed font-medium break-words whitespace-pre-wrap text-ink">{e.body}</p>
                  ) : (
                    <p className="text-sm font-semibold text-ink/70">
                      <span className="text-[11px] font-bold tracking-wider text-muted uppercase">Status · </span>
                      {e.body}
                    </p>
                  )}
                  <time dateTime={e.created_at.toISOString()} className="tabular mt-1 block text-xs font-medium text-muted">{dateTime(e.created_at)}</time>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <aside aria-label="Job details" className="h-fit rounded-3xl bg-white p-5 ring-1 ring-line sm:p-6 lg:sticky lg:top-28">
          <h2 className="text-[11px] font-bold tracking-wider text-muted uppercase">Job details</h2>
          <dl className="mt-4 divide-y divide-line text-sm">
            <Row k="Booked" v={date(job.scheduled_for)} />
            <Row
              k="Technician"
              v={
                <span className="flex items-center gap-2">
                  <span aria-hidden className="grid size-7 place-items-center rounded-lg bg-ink text-xs font-bold text-white">{job.technician?.[0] ?? "?"}</span>
                  {job.technician ?? "Unassigned"}
                </span>
              }
            />
            <Row k="Suburb" v={job.suburb} />
            <Row k="Job type" v={job.job_type} />
          </dl>
          <a href="tel:0344163638" className="mt-5 flex h-11 items-center justify-center rounded-xl bg-paper text-[13px] font-bold tracking-wide text-ink uppercase ring-1 ring-line transition-[background-color,transform] duration-150 ease-out hover:bg-brand-soft active:scale-[0.98]">
            Call the office
          </a>
        </aside>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="font-medium text-muted">{k}</dt>
      <dd className="tabular text-right font-bold">{v}</dd>
    </div>
  );
}

// Status events read "Old → New" or "Job created as New"; colour the marker by the new status.
function statusOf(body: string) {
  const s = body.split(/→| as /).pop()!.trim();
  return (s in STATUS_STYLE ? s : "Scheduled") as keyof typeof STATUS_STYLE;
}
