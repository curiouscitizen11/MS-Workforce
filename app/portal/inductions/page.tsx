import type { Metadata } from "next"
import Link from "next/link"
import { Heading } from "@/components/portal/ui"
import { requireUser } from "@/lib/portal/session"

export const metadata: Metadata = { title: "Inductions" }

export default async function InductionsPlaceholder() {
  await requireUser()
  return (
    <div className="space-y-4">
      <Heading kicker="Inductions" title="Your inductions" text="MS Workforce induction and site inductions are listed here." />
      <Link href="/portal/induction" className="pill pill-teal w-full">
        Open the MS Workforce induction
      </Link>
    </div>
  )
}
