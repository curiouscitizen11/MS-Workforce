import type { Metadata } from "next"
import Link from "next/link"
import { PortalNav } from "@/components/portal/Nav"
import { readSession } from "@/lib/portal/session"

export const metadata: Metadata = {
  title: {
    default: "Worker portal",
    template: "%s | MS Workforce",
  },
  description: "MS Workforce worker portal.",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
  openGraph: {
    title: "Worker portal",
    description: "MS Workforce worker portal.",
    url: "/portal",
  },
  twitter: {
    card: "summary",
    title: "Worker portal",
    description: "MS Workforce worker portal.",
  },
}

export const dynamic = "force-dynamic"

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const current = await readSession()
  const home = current?.worker.role === "admin" ? "/portal/admin" : "/portal"
  return (
    <div className="portal-root min-h-svh bg-tint text-navy">
      <header className="bg-navy text-white">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
          <Link href={current ? home : "/portal/login"} className="leading-none">
            <span className="block text-base font-semibold tracking-tight">
              MS <span className="text-teal-400">|</span> WORKFORCE
            </span>
            <span className="mt-0.5 block text-[10px] font-medium tracking-[0.18em] text-white/70">WORKER PORTAL</span>
          </Link>
          {current ? (
            <Link href="/portal/account" className="inline-flex min-h-12 items-center text-sm font-semibold text-white">
              {current.worker.role === "admin" ? "Admin" : "Account"}
            </Link>
          ) : (
            <Link href="/" className="inline-flex min-h-12 items-center text-sm font-semibold text-white">
              Website
            </Link>
          )}
        </div>
        <div className="h-[3px] bg-[#14B8A6]" aria-hidden="true" />
      </header>
      <div className="mx-auto w-full max-w-xl px-4 pb-28 pt-4">{children}</div>
      {current ? <PortalNav role={current.worker.role} /> : null}
    </div>
  )
}
