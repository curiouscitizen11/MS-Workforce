import type { Metadata } from "next"
import { Heading } from "@/components/portal/ui"
import { adminEmail } from "@/lib/portal/config"
import { requireUser } from "@/lib/portal/session"

export const metadata: Metadata = { title: "Help" }

export default async function HelpPage() {
  await requireUser()
  const email = adminEmail()
  return (
    <div className="space-y-4">
      <Heading kicker="Help" title="Contact MS Workforce" text="Send an email and we will reply. This page does not show a phone number." />
      <a className="pill pill-teal w-full" href={"mailto:" + email}>
        Email {email}
      </a>
    </div>
  )
}
