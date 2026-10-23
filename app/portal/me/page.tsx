import type { Metadata } from "next"
import Link from "next/link"
import { cookies } from "next/headers"
import { DetailsForm, SafetyForm } from "@/components/portal/MeForms"
import { LogOutButton } from "@/components/portal/LogOutButton"
import { ThemeSwitch } from "@/components/portal/ThemeSwitch"
import { Heading } from "@/components/portal/ui"
import { formatAuMobile } from "@/lib/portal/phone"
import { requireUser } from "@/lib/portal/session"
import { THEME_COOKIE, themeFromCookie } from "@/lib/portal/theme"

export const metadata: Metadata = { title: "Me" }

export default async function MePage() {
  const { worker } = await requireUser()
  const theme = themeFromCookie(cookies().get(THEME_COOKIE)?.value)
  const shown = { ...worker, mobile: formatAuMobile(worker.mobile) }
  return (
    <div className="space-y-4">
      <Heading kicker="Me" title={worker.preferredName || worker.name.split(" ")[0]} text="Your photo, details and private safety info." />
      {worker.role === "worker" ? (
        <>
          <section className="space-y-2 rounded-2xl border border-navy/10 bg-white p-4">
            <h2 className="text-sm font-semibold">My photo</h2>
            <p className="text-sm leading-relaxed text-navy/70">A clear photo of your face for your worker ID card. Mav checks it before it shows.</p>
            <Link href="/portal/me/photo" className="pill pill-line-dark w-full">
              Add or change photo
            </Link>
          </section>
          <section className="space-y-2 rounded-2xl border border-navy/10 bg-white p-4">
            <h2 className="text-sm font-semibold">My details</h2>
            <DetailsForm worker={shown} />
          </section>
          <section className="space-y-2 rounded-2xl border border-navy/10 bg-white p-4">
            <h2 className="text-sm font-semibold">Safety info</h2>
            <SafetyForm worker={worker} />
          </section>
        </>
      ) : (
        <p className="text-sm">Admin accounts do not keep safety info here.</p>
      )}
      <nav className="grid gap-2" aria-label="More">
        <Link href="/portal/tickets" className="portal-tile">
          Tickets & training
        </Link>
        <Link href="/portal/inductions" className="portal-tile">
          Inductions
        </Link>
      </nav>
      <section className="space-y-2 rounded-2xl border border-navy/10 bg-white p-4">
        <h2 className="text-sm font-semibold">Preferences</h2>
        <p className="text-sm text-navy/70">The portal opens in the MS Workforce dark look. Light is optional.</p>
        <ThemeSwitch theme={theme} />
      </section>
      <LogOutButton />
    </div>
  )
}
