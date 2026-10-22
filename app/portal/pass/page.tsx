import type { Metadata } from "next"
import { Heading } from "@/components/portal/ui"
import { requireUser } from "@/lib/portal/session"

export const metadata: Metadata = { title: "Site pass" }

export default async function PassPlaceholder() {
  await requireUser()
  return (
    <div className="space-y-4">
      <Heading kicker="Site pass" title="Your worker ID card" text="Your card will show here. Builders scan it to check your tickets." />
    </div>
  )
}
