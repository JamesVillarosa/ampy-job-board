import Link from "next/link";

export default function NotFound() {
  return (
    <div className="px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Job not found</h1>
      <p className="mt-2 text-sm text-muted">It may have been removed, or the link is wrong.</p>
      <Link href="/" className="mt-6 inline-flex h-9 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white transition-[background-color,transform] duration-150 ease-out hover:bg-brand active:scale-[0.97]">Back to all jobs</Link>
    </div>
  );
}
