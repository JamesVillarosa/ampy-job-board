"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="py-20 text-center">
      <h1 className="font-display text-xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-sm text-stone-500">
        The error has been logged{error.digest ? ` (ref ${error.digest})` : ""}.
      </p>
      <button onClick={reset} className="mt-4 text-sm font-medium text-brand-deep underline-offset-4 hover:underline">Try again</button>
    </div>
  );
}
