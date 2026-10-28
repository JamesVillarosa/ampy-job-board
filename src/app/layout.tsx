import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Geist_Mono, Inter } from "next/font/google";
import { AskBoard } from "./ask";
import "./globals.css";

const ui = Inter({ variable: "--font-ui", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-figures", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Job Board · Ampy Electrical",
  description: "Live job board for Ampy Electrical, Bendigo.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU" className={`${ui.variable} ${mono.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-sm focus:text-white">
          Skip to content
        </a>

        <header className="sticky top-0 z-20 bg-ink text-white">
          <div className="shell flex h-14 items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <Link href="/" className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
                <Image src="/logo.png" alt="Ampy Electrical" width={807} height={282} priority className="h-6 w-auto brightness-0 invert" />
              </Link>
              <nav aria-label="Main" className="flex items-center gap-1 text-sm font-medium">
                <Link href="/" aria-current="page" className="relative rounded-md px-2.5 py-1.5 text-white after:absolute after:inset-x-2.5 after:-bottom-[13px] after:h-0.5 after:rounded-full after:bg-brand">Jobs</Link>
                <a href="/api/health" className="hidden rounded-md px-2.5 py-1.5 text-white/60 transition-colors hover:text-white sm:inline">System status</a>
              </nav>
            </div>
            <a href="tel:0344163638" className="tabular text-sm font-medium text-white/60 transition-colors hover:text-white">
              <span className="hidden sm:inline">Office </span>(03) 4416 3638
            </a>
          </div>
        </header>

        <main id="main" className="flex-1 pb-24">{children}</main>

        <AskBoard />
      </body>
    </html>
  );
}
