import type { Metadata } from "next"
import { JoinForm } from "@/components/portal/JoinForm"
import { Heading } from "@/components/portal/ui"
import { readInviteToken } from "@/lib/portal/invite"
import { formatAuMobile } from "@/lib/portal/phone"

export const metadata: Metadata = { title: "Join MS Workforce" }

export default function JoinPage({ searchParams }: { searchParams: { invite?: string | string[] } }) {
  const raw = searchParams.invite
  const token = Array.isArray(raw) ? raw[0] : raw || ""
  const invite = token ? readInviteToken(token) : null
  const ready = invite?.ok ? invite : null
  return (
    <div className="space-y-4">
      <Heading kicker="Join" title="Join MS Workforce" text="One short form. No tax, bank or super details." />
      <JoinForm
        initialName={ready?.name || ""}
        initialMobile={ready ? formatAuMobile(ready.mobile) : ""}
        inviteToken={ready ? token : ""}
        expired={Boolean(token) && !ready}
      />
    </div>
  )
}
