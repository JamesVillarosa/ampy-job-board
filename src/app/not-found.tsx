import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="font-display text-xl font-bold">Job not found</h1>
      <p className="mt-2 text-sm text-stone-500">It may have been removed, or the link is wrong.</p>
      <Link href="/" className="mt-4 inline-block text-sm font-medium text-brand-deep underline-offset-4 hover:underline">Back to all jobs</Link>
    </div>
  );
}
