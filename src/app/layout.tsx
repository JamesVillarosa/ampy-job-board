import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";

const body = Inter({ variable: "--font-body", subsets: ["latin"] });
const display = Montserrat({ variable: "--font-heading", subsets: ["latin"], weight: ["600", "700"] });

export const metadata: Metadata = {
  title: "Job Board · Ampy",
  description: "Live job board for Ampy Electrical, Bendigo.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU" className={`${body.variable} ${display.variable}`}>
      <body className="min-h-dvh">
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
              <span aria-hidden className="grid size-7 place-items-center rounded-md bg-brand text-white">
                <svg viewBox="0 0 24 24" className="size-4" fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" /></svg>
              </span>
              <span className="font-display text-[15px] font-bold tracking-tight">Ampy</span>
            </Link>
            <span className="text-stone-300">/</span>
            <span className="text-sm text-stone-600">Job Board</span>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </body>
    </html>
  );
}
