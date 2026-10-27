"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="px-4 py-20 text-center">
      <h1 className="text-3xl font-black tracking-tight uppercase">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted">
        The error has been logged{error.digest ? ` (ref ${error.digest})` : ""}.
      </p>
      <button onClick={reset} className="mt-6 inline-flex h-10 items-center rounded-lg bg-brand px-5 text-[13px] font-bold tracking-wide text-white uppercase transition-[background-color,transform] duration-150 ease-out hover:bg-brand-deep active:scale-[0.97]">Try again</button>
    </div>
  );
}
