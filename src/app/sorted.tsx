"use client";

import Link from "next/link";
import { Children } from "react";
import { useSearchParams } from "next/navigation";
import type { Sort } from "@/lib/db";

// Reorders server-rendered rows by the URL's sort with no server round trip.
// ranks[i] holds row i's position under every sort, computed by the same SQL that sorts the page.
export function Sorted({ as: Tag, ranks, className, children }: { as: "ul" | "tbody"; ranks: Record<Sort, number>[]; className?: string; children: React.ReactNode }) {
  const sort = (useSearchParams().get("sort") ?? "attention") as Sort;
  const rows = Children.toArray(children);
  const order = rows.map((_, i) => i).sort((a, b) => (ranks[a][sort] ?? a) - (ranks[b][sort] ?? b));
  return <Tag className={className}>{order.map((i) => rows[i])}</Tag>;
}

// Filter links built on the server don't know a sort picked on the client; add it here.
export function KeepSort({ href, ...props }: React.ComponentProps<typeof Link> & { href: string }) {
  const sort = useSearchParams().get("sort");
  const url = new URL(href, "http://x");
  if (sort) url.searchParams.set("sort", sort);
  return <Link href={url.pathname + url.search} {...props} />;
}
