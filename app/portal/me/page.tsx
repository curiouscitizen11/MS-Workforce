import type { Metadata } from "next"
import { cookies } from "next/headers"
import { ThemeSwitch } from "@/components/portal/ThemeSwitch"
import { Heading } from "@/components/portal/ui"
import { requireUser } from "@/lib/portal/session"
import { THEME_COOKIE, themeFromCookie } from "@/lib/portal/theme"
import { LogOutButton } from "@/components/portal/LogOutButton"

export const metadata: Metadata = { title: "Me" }

export default async function MePage() {
  const { worker } = await requireUser()
  const theme = themeFromCookie(cookies().get(THEME_COOKIE)?.value)
  return (
    <div className="space-y-4">
      <Heading kicker="Me" title={worker.preferredName || worker.name.split(" ")[0]} text="Your details, safety info and settings." />
      <section className="space-y-2 rounded-2xl border border-navy/10 bg-white p-4">
        <h2 className="text-sm font-semibold">Preferences</h2>
        <p className="text-sm text-navy/70">The portal opens in the MS Workforce dark look. Light is optional.</p>
        <ThemeSwitch theme={theme} />
      </section>
      <LogOutButton />
    </div>
  )
}
