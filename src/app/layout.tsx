import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import "./globals.css";

const brand = Montserrat({ variable: "--font-brand", subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: "Job Board · Ampy Electrical",
  description: "Live job board for Ampy Electrical, Bendigo.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU" className={brand.variable}>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-sm focus:text-white">
          Skip to content
        </a>

        <div className="bg-brand text-white">
          <div className="mx-auto flex h-10 max-w-7xl items-center justify-between gap-4 px-4 text-xs font-semibold tracking-wide uppercase sm:px-6">
            <span className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-white/70 motion-reduce:hidden" />
                <span className="relative inline-flex size-2 rounded-full bg-white" />
              </span>
              Ops portal · Bendigo
            </span>
            <a href="tel:0344163638" className="hidden items-center gap-2 rounded-md bg-white px-3 py-1 text-brand transition-transform duration-150 ease-out active:scale-[0.97] sm:flex">
              <svg aria-hidden viewBox="0 0 24 24" className="size-3.5" fill="currentColor"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1L6.6 10.8Z" /></svg>
              Office (03) 4416 3638
            </a>
          </div>
        </div>

        <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:h-20 sm:px-6">
            <Link href="/" className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
              <Image src="/logo.png" alt="Ampy Electrical" width={807} height={282} priority className="h-9 w-auto sm:h-11" />
            </Link>
            <nav aria-label="Main" className="flex items-center gap-6 text-[13px] font-bold tracking-wide uppercase">
              <Link href="/" className="text-brand">Job board</Link>
              <a href="/api/health" className="hidden text-ink/70 transition-colors hover:text-brand sm:inline">System status</a>
            </nav>
          </div>
        </header>

        <main id="main" className="flex-1 overflow-x-clip">{children}</main>

        <footer className="mt-6 bg-ink text-white/70">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 text-sm sm:grid-cols-[1.5fr_1fr_1fr] sm:px-6">
            <div>
              <Image src="/logo.png" alt="Ampy Electrical" width={807} height={282} className="h-10 w-auto brightness-0 invert" />
              <p className="mt-4 max-w-xs leading-relaxed">Internal ops portal for Ampy Electrical. Licensed electricians servicing Bendigo and surrounds.</p>
            </div>
            <div>
              <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">Office</p>
              <ul className="mt-3 space-y-2 font-medium">
                <li><a href="tel:0344163638" className="transition-colors hover:text-white">(03) 4416 3638</a></li>
                <li><a href="mailto:hello@ampy.com" className="transition-colors hover:text-white">hello@ampy.com</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">Portal</p>
              <ul className="mt-3 space-y-2 font-medium">
                <li><Link href="/" className="transition-colors hover:text-white">Job board</Link></li>
                <li><a href="/api/health" className="transition-colors hover:text-white">System status</a></li>
                <li><a href="https://ampy.com.au" className="transition-colors hover:text-white">ampy.com.au</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10">
            <p className="mx-auto max-w-7xl px-4 py-5 text-xs sm:px-6">© Ampy Electrical · Internal tools</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
