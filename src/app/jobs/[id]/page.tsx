import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getJob } from "@/lib/db";
import { STATUS_STYLE } from "@/lib/status";
import { date, dateTime, money } from "@/lib/format";
import { Tech } from "../../components";
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
      <Link href="/" className="group inline-flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-brand-deep">
        <span aria-hidden className="transition-transform duration-200 ease-out group-hover:-translate-x-0.5">←</span> All jobs
      </Link>

      <section className="brand-panel overflow-hidden rounded-3xl p-5 text-white shadow-[0_24px_48px_-28px_rgb(160_50_0/0.7)] sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white/85">
              <span className="tabular">{job.job_number}</span> · {job.job_type}
            </p>
            <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{job.customer}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-white/90">
              <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" /></svg>
              {job.suburb}, VIC
            </p>
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="text-sm font-semibold text-white/85">Job value</p>
            <p className="tabular text-4xl font-extrabold tracking-tight">{money(job.value)}</p>
          </div>
        </div>
        <div className="mt-6 border-t border-white/20 pt-5">
          <p className="mb-2 text-sm font-semibold text-white/85">Update the status</p>
          <StatusForm jobId={job.id} current={job.status} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="activity" className="rounded-2xl bg-white p-5 ring-1 ring-line sm:p-7">
          <div className="flex items-baseline justify-between">
            <h2 id="activity" className="text-xl font-extrabold tracking-tight">Activity</h2>
            <span className="tabular text-xs text-muted">{notes} {notes === 1 ? "note" : "notes"}</span>
          </div>
          <div className="mt-5">
            <NoteForm jobId={job.id} />
          </div>
          <ol className="mt-8">
            {events.map((e) => (
              <li key={e.id} data-kind={e.kind} className="group/item relative flex gap-3 pb-5 last:pb-0">
                <span aria-hidden className="absolute top-7 bottom-1 left-[11px] w-px bg-line group-last/item:hidden" />
                <span aria-hidden className={`relative mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg ${e.kind === "note" ? "bg-brand text-white" : "bg-canvas ring-1 ring-line"}`}>
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
        <aside aria-label="Job details" className="rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6">
          <h2 className="text-lg font-extrabold tracking-tight">Job details</h2>
          <dl className="mt-2 divide-y divide-line text-sm">
            <Row k="Booked" v={date(job.scheduled_for)} />
            <Row k="Technician" v={<Tech name={job.technician} />} />
            <Row k="Suburb" v={job.suburb} />
            <Row k="Job type" v={job.job_type} />
          </dl>
          <a href="tel:0344163638" className="mt-5 flex h-11 items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-brand-deep active:scale-[0.97]">
            Call the office
          </a>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${job.suburb} VIC`)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 flex h-11 items-center justify-center rounded-xl bg-canvas text-sm font-bold text-ink transition-[background-color,transform] duration-150 ease-out hover:bg-line active:scale-[0.97]"
          >
            Directions to {job.suburb}
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
      <dd className="tabular text-right font-semibold">{v}</dd>
    </div>
  );
}

// Status events read "Old → New" or "Job created as New"; colour the marker by the new status.
function statusOf(body: string) {
  const s = body.split(/→| as /).pop()!.trim();
  return (s in STATUS_STYLE ? s : "Scheduled") as keyof typeof STATUS_STYLE;
}
