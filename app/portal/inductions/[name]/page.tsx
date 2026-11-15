import type { Metadata } from "next"
import Link from "next/link"
import { InductionDetail } from "@/components/portal/InductionDetail"
import { Heading } from "@/components/portal/ui"
import { inductionRows } from "@/lib/portal/inductions"
import { requireUser } from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"

export const metadata: Metadata = { title: "Induction" }

export default async function InductionDetailPage({ params }: { params: { name: string } }) {
  const { name } = await Promise.resolve(params)
  const label = decodeURIComponent(name)
  const { worker } = await requireUser()
  if (worker.role !== "worker") {
    return <p className="text-sm">Admin accounts do not keep inductions here.</p>
  }
  const offers = (await (await getStore()).offers.all()).filter((offer) => offer.workerId === worker.id)
  const row = inductionRows({
    inductionPassed: worker.inductionPassed,
    siteInductions: worker.siteInductions,
    offers,
  }).find((item) => item.kind === "site" && item.name.toLowerCase() === label.toLowerCase())
  if (!row) {
    return (
      <div className="space-y-4">
        <Heading kicker="Induction" title="Not on your list" text="That induction is not on your list." />
        <Link href="/portal/inductions" className="inline-flex min-h-12 items-center text-sm font-semibold text-[#2ec4b6]">
          Back to inductions
        </Link>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      <Heading kicker="Induction" title={row.name} />
      <InductionDetail name={row.name} status={row.status} done={row.done} link={row.link} />
    </div>
  )
}
