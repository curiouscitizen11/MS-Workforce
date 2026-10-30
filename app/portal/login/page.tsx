import type { Metadata } from "next"
import { DemoBanner, Heading } from "@/components/portal/ui"
import { LoginForm } from "@/components/portal/LoginForm"
import { isMock } from "@/lib/portal/config"
import { formatAuMobile } from "@/lib/portal/phone"
import { readMobileCookie, readSession } from "@/lib/portal/session"
import { portalHome } from "@/lib/portal/home"
import { getStore } from "@/lib/portal/store"
import { redirect } from "next/navigation"

export const metadata: Metadata = { title: "Use your mobile" }

export default async function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const current = await readSession()
  if (current) redirect(portalHome(current.worker.role))
  const store = await getStore()
  const workers = await store.workers.all()
  const sam = workers.find((worker) => worker.id === "w-sam")
  const mav = workers.find((worker) => worker.role === "admin")
  const demos = [sam, mav]
    .filter((worker): worker is NonNullable<typeof worker> => Boolean(worker))
    .map((worker) => ({
      name: worker.name,
      mobile: formatAuMobile(worker.mobile),
      hint: worker.role === "admin" ? "Admin, then authenticator code" : "Worker",
    }))
  return (
    <div className="space-y-4">
      <DemoBanner mock={isMock()} />
      <Heading kicker="Log in" title="Use your mobile" text="We'll text a 6-digit code. No password." />
      {searchParams.error ? <p className="text-sm font-semibold text-[#B91C1C]">That login link has expired. Request a new one.</p> : null}
      <LoginForm mock={isMock()} demos={demos} initialMobile={await readMobileCookie()} />
      <p className="text-sm">
        New here?{" "}
        <a className="font-semibold text-teal-600 underline" href="/portal/apply">
          Apply for work
        </a>
      </p>
    </div>
  )
}
