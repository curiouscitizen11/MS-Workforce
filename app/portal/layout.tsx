import type { Metadata, Viewport } from "next"
import Link from "next/link"
import { cookies } from "next/headers"
import PortalOpeningSoon from "@/components/PortalOpeningSoon"
import { AddHomeHint } from "@/components/portal/AddHomeHint"
import { PortalBottomNav, PortalHeaderSlot } from "@/components/portal/PortalChrome"
import { portalReachable } from "@/lib/portal/access"
import { readSession } from "@/lib/portal/session"
import { THEME_COOKIE, themeFromCookie } from "@/lib/portal/theme"

export const metadata: Metadata = {
  title: {
    default: "Worker portal",
    template: "%s | MS Workforce",
  },
  description: "MS Workforce worker portal.",
  applicationName: "MS Workforce",
  manifest: "/portal/manifest",
  appleWebApp: {
    capable: true,
    title: "MS Workforce",
    statusBarStyle: "black-translucent",
  },
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

export const viewport: Viewport = {
  themeColor: "#0b1a2e",
}

export const dynamic = "force-dynamic"

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  if (!portalReachable()) {
    return (
      <div className="portal-root min-h-svh" data-theme="dark">
        <div className="mx-auto w-full max-w-3xl px-5 py-8 md:px-8">
          <PortalOpeningSoon />
        </div>
      </div>
    )
  }
  const current = await readSession()
  const home = current?.worker.role === "admin" ? "/portal/admin" : "/portal"
  const theme = themeFromCookie((await cookies()).get(THEME_COOKIE)?.value)
  return (
    <div className="portal-root min-h-svh" data-theme={theme}>
      <header className="portal-header">
        <div className="portal-header-inner">
          {current ? <PortalHeaderSlot name={current.worker.name} role={current.worker.role} /> : <span className="portal-header-side" />}
          <Link href={current ? home : "/portal/login"} className="portal-wordmark flex min-h-12 flex-col justify-center">
            <span className="block text-[19px] font-semibold tracking-tight">
              MS <span className="text-teal">|</span> WORKFORCE
            </span>
            <span className="mt-1 block text-[11px] font-medium tracking-[0.2em] text-body">LABOUR HIRE</span>
          </Link>
          {current ? <span className="portal-header-side" /> : (
            <Link href="/" className="portal-header-site">
              Website
            </Link>
          )}
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl px-5 pb-28 pt-8 md:px-8 md:pt-12">
        <AddHomeHint />
        {children}
      </div>
      {current ? <PortalBottomNav role={current.worker.role} /> : null}
    </div>
  )
}
