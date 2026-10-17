import type { Metadata } from "next"
import { AdminCodeForm } from "@/components/portal/LoginForm"
import { Heading } from "@/components/portal/ui"
import { adminTotpSecret, isMock } from "@/lib/portal/config"
import { readPendingWorkerId } from "@/lib/portal/session"
import { totpCode } from "@/lib/portal/totp"
import { redirect } from "next/navigation"

export const metadata: Metadata = { title: "One more code" }

export default function AdminLoginPage() {
  const workerId = readPendingWorkerId()
  if (!workerId) redirect("/portal/login")
  const devCode = isMock() ? totpCode(adminTotpSecret(), Date.now()) : undefined
  return (
    <div className="space-y-4">
      <Heading kicker="Admin" title="One more code" text="This second code is only for the MS Workforce admin." />
      <AdminCodeForm devCode={devCode} />
    </div>
  )
}
