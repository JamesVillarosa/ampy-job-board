import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getJob } from "@/lib/db";
import { STATUS_STYLE } from "@/lib/status";
import { date, dateTime, money } from "@/lib/format";
import { AiBrief, NoteForm, StatusForm } from "./forms";

export async function generateMetadata({ params }: PageProps<"/jobs/[id]">) {
  const data = await load((await params).id);
  return { title: data ? `${data.job.job_number} ${data.job.customer} · Ampy` : "Job not found · Ampy" };
}

async function load(id: string) {
  return /^\d{1,9}$/.test(id) ? getJob(Number(id)) : null;
}

export default function JobPage({ params }: PageProps<"/jobs/[id]">) {
  return (
    <div className="shell py-6 sm:py-8">
      <Suspense fallback={<div aria-busy className="h-72 animate-pulse rounded-xl bg-line/70" />}>
        <JobDetail params={params} />
      </Suspense>
    </div>
  );
}

async function JobDetail({ params }: Pick<PageProps<"/jobs/[id]">, "params">) {
  const data = await load((await params).id);
  if (!data) notFound();
  const { job, events } = data;
  const notes = events.filter((e) => e.kind === "note").length;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted transition-colors hover:text-ink">
          <span aria-hidden>←</span> Jobs
        </Link>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">{job.customer}</h1>
            <p className="mt-1 text-sm text-muted">
              <span className="font-mono">{job.job_number}</span> · {job.job_type} · {job.suburb}, VIC
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs text-muted">Job value</p>
            <p className="font-mono text-2xl font-semibold tracking-tight">{money(job.value)}</p>
          </div>
        </div>
        <div className="mt-5">
          <StatusForm jobId={job.id} current={job.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="activity" className="rounded-xl bg-white p-5 ring-1 ring-line sm:p-6">
          <div className="flex items-baseline justify-between">
            <h2 id="activity" className="text-base font-semibold">Activity</h2>
            <span className="tabular text-xs text-muted">{notes} {notes === 1 ? "note" : "notes"}</span>
          </div>
          <div className="mt-5">
            <NoteForm jobId={job.id} />
          </div>
          <ol className="mt-8">
            {events.map((e) => (
              <li key={e.id} data-kind={e.kind} className="group/item relative flex gap-3 pb-5 last:pb-0">
                <span aria-hidden className="absolute top-7 bottom-1 left-[11px] w-px bg-line group-last/item:hidden" />
                <span aria-hidden className={`relative mt-0.5 grid size-6 shrink-0 place-items-center rounded-md ${e.kind === "note" ? "bg-ink text-white" : "bg-canvas ring-1 ring-line"}`}>
                  {e.kind === "note" ? (
                    <svg viewBox="0 0 20 20" className="size-3.5" fill="currentColor"><path d="M4 3h12a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3v-3H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /></svg>
                  ) : (
                    <span className={`size-2 rounded-full ${STATUS_STYLE[statusOf(e.body)].dot}`} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  {e.kind === "note" ? (
                    <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-ink">{e.body}</p>
                  ) : (
                    <p className="text-sm text-ink/80">
                      <span className="text-muted">Status: </span>
                      {e.body}
                    </p>
                  )}
                  <time dateTime={e.created_at.toISOString()} className="tabular mt-0.5 block text-xs text-muted">{dateTime(e.created_at)}</time>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="h-fit space-y-6 lg:sticky lg:top-20">
        <aside aria-label="Job details" className="rounded-xl bg-white p-5 ring-1 ring-line">
          <h2 className="text-base font-semibold">Details</h2>
          <dl className="mt-2 divide-y divide-line text-sm">
            <Row k="Booked" v={date(job.scheduled_for)} />
            <Row
              k="Technician"
              v={
                <span className="flex items-center gap-2">
                  <span aria-hidden className="grid size-6 place-items-center rounded-full bg-canvas text-xs font-semibold text-ink ring-1 ring-line">{job.technician?.[0] ?? "?"}</span>
                  {job.technician ?? "Unassigned"}
                </span>
              }
            />
            <Row k="Suburb" v={job.suburb} />
            <Row k="Job type" v={job.job_type} />
          </dl>
          <a href="tel:0344163638" className="mt-4 flex h-9 items-center justify-center rounded-lg bg-white text-sm font-medium text-ink ring-1 ring-line transition-[background-color,transform] duration-150 ease-out hover:bg-canvas active:scale-[0.97]">
            Call the office
          </a>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${job.suburb} VIC`)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 flex h-9 items-center justify-center rounded-lg text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            Open {job.suburb} in Maps ↗
          </a>
        </aside>
        <AiBrief jobId={job.id} />
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-muted">{k}</dt>
      <dd className="tabular text-right font-medium">{v}</dd>
    </div>
  );
}

// Status events read "Old → New" or "Job created as New"; colour the marker by the new status.
function statusOf(body: string) {
  const s = body.split(/→| as /).pop()!.trim();
  return (s in STATUS_STYLE ? s : "Scheduled") as keyof typeof STATUS_STYLE;
}
