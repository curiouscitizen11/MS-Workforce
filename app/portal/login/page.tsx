import type { Metadata } from "next"
import { DemoBanner, Heading } from "@/components/portal/ui"
import { LoginForm } from "@/components/portal/LoginForm"
import { isMock } from "@/lib/portal/config"
import { twilioReady } from "@/lib/portal/notify"
import { loginDemos } from "@/lib/portal/login-demos"
import { readEmailCookie, readMobileCookie, readSession } from "@/lib/portal/session"
import { portalHome } from "@/lib/portal/home"
import { getStore } from "@/lib/portal/store"
import { redirect } from "next/navigation"

export const metadata: Metadata = { title: "Use your email" }

export default async function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const query = await Promise.resolve(searchParams)
  const current = await readSession()
  if (current) redirect(portalHome(current.worker.role))
  const mock = isMock()
  const demos = mock ? await loginDemos(await getStore(), true) : []
  const sms = twilioReady()
  return (
    <div className="space-y-4">
      <DemoBanner mock={isMock()} />
      <Heading kicker="Log in" title="Use your email" text="We'll email a 6-digit code. No password." />
      {query.error ? <p className="text-sm font-semibold text-[#B91C1C]">That login link has expired. Request a new one.</p> : null}
      <LoginForm mock={isMock()} sms={sms} demos={demos.filter((demo) => demo.email)} initialEmail={await readEmailCookie()} initialMobile={await readMobileCookie()} />
      <p className="text-sm">
        New here?{" "}
        <a className="font-semibold text-teal-600 underline" href="/portal/apply">
          Apply for work
        </a>
      </p>
    </div>
  )
}
