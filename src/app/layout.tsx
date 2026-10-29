import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Inter, Montserrat } from "next/font/google";
import { AskBoard, AskHeaderButton } from "./ask";
import "./globals.css";

const brand = Montserrat({ variable: "--font-brand", subsets: ["latin"] });
const ui = Inter({ variable: "--font-ui", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Job Board · Ampy Electrical",
  description: "Live job board for Ampy Electrical, Bendigo.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU" className={`${brand.variable} ${ui.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-sm focus:text-white">
          Skip to content
        </a>

        <header className="sticky top-0 z-20 border-b border-line bg-white">
          <div className="shell flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <Link href="/" className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
                <Image src="/logo.png" alt="Ampy Electrical" width={807} height={282} priority className="h-9 w-auto" />
              </Link>
              <span className="hidden h-6 w-px bg-line sm:block" />
              <span className="hidden text-sm font-semibold text-muted sm:block">Team job board</span>
            </div>
            <div className="flex items-center gap-2">
            <AskHeaderButton />
            <a
              href="tel:0344163638"
              className="flex h-10 items-center gap-2 rounded-full bg-brand-soft px-4 text-sm font-bold text-brand-deep transition-[background-color,transform] duration-150 ease-out hover:bg-brand/15 active:scale-[0.97]"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="currentColor"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1L6.6 10.8Z" /></svg>
              <span className="hidden sm:inline">Call the office</span>
              <span className="sm:hidden">Office</span>
            </a>
            </div>
          </div>
        </header>

        <main id="main" className="flex-1 pb-24">{children}</main>

        <AskBoard />
      </body>
    </html>
  );
}
