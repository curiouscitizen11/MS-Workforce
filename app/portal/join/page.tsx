import type { Metadata } from "next"
import { JoinForm } from "@/components/portal/JoinForm"
import { Heading } from "@/components/portal/ui"

export const metadata: Metadata = { title: "Join MS Workforce" }

export default function JoinPage() {
  return (
    <div className="space-y-4">
      <Heading kicker="Join" title="Join MS Workforce" text="One short form. No tax, bank or super details." />
      <JoinForm />
    </div>
  )
}
