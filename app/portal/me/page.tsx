import type { Metadata } from "next"
import Link from "next/link"
import { cookies } from "next/headers"
import { DetailsForm, SafetyForm } from "@/components/portal/MeForms"
import { LogOutButton } from "@/components/portal/LogOutButton"
import { ThemeSwitch } from "@/components/portal/ThemeSwitch"
import { Heading } from "@/components/portal/ui"
import { inductionRows } from "@/lib/portal/inductions"
import { formatAuMobile } from "@/lib/portal/phone"
import { requireUser } from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"
import { THEME_COOKIE, themeFromCookie } from "@/lib/portal/theme"

export const metadata: Metadata = { title: "Me" }

export default async function MePage() {
  const { worker } = await requireUser()
  const theme = themeFromCookie(cookies().get(THEME_COOKIE)?.value)
  const shown = { ...worker, mobile: formatAuMobile(worker.mobile) }
  const offers = worker.role === "worker" ? (await (await getStore()).offers.all()).filter((offer) => offer.workerId === worker.id) : []
  const inductions = inductionRows({ inductionPassed: worker.inductionPassed, siteInductions: worker.siteInductions, offers })
  return (
    <div className="space-y-4">
      <Heading kicker="Me" title={worker.name.split(" ")[0]} text="Your photo, details and private safety info." />
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
          <section id="safety" className="space-y-2 rounded-2xl border border-navy/10 bg-white p-4">
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
      </nav>
      {worker.role === "worker" ? (
        <section aria-label="Inductions">
          <h2 className="px-1 pb-1 text-sm font-semibold">Inductions</h2>
          <div className="portal-list">
            {inductions.map((row) => (
              <Link key={row.id} href={row.href || "/portal/inductions"} className="portal-list-row">
                <span className="portal-list-label">{row.name}</span>
                <span className={"portal-list-status" + (row.done ? "" : " portal-home-attention")}>{row.status}</span>
                <span className="portal-list-chev" aria-hidden="true">
                  ›
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      <section id="preferences" className="space-y-2 rounded-2xl border border-navy/10 bg-white p-4">
        <h2 className="text-sm font-semibold">Preferences</h2>
        <p className="text-sm text-navy/70">The portal opens in the MS Workforce dark look. Light is optional.</p>
        <ThemeSwitch theme={theme} />
      </section>
      <LogOutButton />
    </div>
  )
}
