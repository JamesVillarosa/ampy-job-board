import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getJob } from "@/lib/db";
import { date, dateTime, money } from "@/lib/format";
import { StatusBadge } from "../../components";
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
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse rounded-xl bg-stone-200/70" />}>
      <JobDetail params={params} />
    </Suspense>
  );
}

async function JobDetail({ params }: Pick<PageProps<"/jobs/[id]">, "params">) {
  const data = await load((await params).id);
  if (!data) notFound();
  const { job, events } = data;

  return (
    <div className="space-y-6">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-stone-900">
        <span aria-hidden>←</span> All jobs
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="tabular text-sm text-stone-500">{job.job_number}</p>
          <h1 className="mt-0.5 font-display text-2xl font-bold tracking-tight text-balance">{job.customer}</h1>
          <p className="mt-1 text-stone-600">{job.job_type} · {job.suburb}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={job.status} />
          <StatusForm jobId={job.id} current={job.status} />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-stone-200 bg-stone-200 sm:grid-cols-4">
        {[
          ["Value", money(job.value)],
          ["Scheduled", date(job.scheduled_for)],
          ["Technician", job.technician ?? "Unassigned"],
          ["Suburb", job.suburb],
        ].map(([k, v]) => (
          <div key={k} className="bg-white px-4 py-3">
            <dt className="text-xs font-medium text-stone-500">{k}</dt>
            <dd className="tabular mt-0.5 font-medium">{v}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="activity" className="rounded-xl border border-stone-200 bg-white p-4 sm:p-6">
        <h2 id="activity" className="font-display text-base font-semibold">Activity</h2>
        <div className="mt-4">
          <NoteForm jobId={job.id} />
        </div>
        <ol className="mt-6 space-y-4 border-l border-stone-200 pl-5">
          {events.map((e) => (
            <li key={e.id} className="enter relative" data-kind={e.kind}>
              <span
                aria-hidden
                className={`absolute top-1.5 -left-[25px] size-2.5 rounded-full ring-4 ring-white ${e.kind === "note" ? "bg-brand" : "bg-stone-300"}`}
              />
              <p className={`text-sm whitespace-pre-wrap ${e.kind === "status" ? "text-stone-500" : "text-stone-900"}`}>
                {e.kind === "status" ? <span className="font-medium text-stone-700">Status · </span> : null}
                {e.body}
              </p>
              <time dateTime={e.created_at.toISOString()} className="tabular text-xs text-stone-400">{dateTime(e.created_at)}</time>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
