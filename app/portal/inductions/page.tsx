import type { Metadata } from "next"
import { InductionBook } from "@/components/portal/InductionBook"
import { Heading } from "@/components/portal/ui"
import { inductionPickerSites, inductionRows } from "@/lib/portal/inductions"
import { requireUser } from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"

export const metadata: Metadata = { title: "Inductions" }

export default async function InductionsPage() {
  const { worker } = await requireUser()
  const offers = (await (await getStore()).offers.all()).filter((offer) => offer.workerId === worker.id)
  const rows = inductionRows({
    inductionPassed: worker.inductionPassed,
    siteInductions: worker.siteInductions,
    offers,
  })
  return (
    <div className="space-y-3">
      <Heading kicker="Inductions" title="Your inductions" text="MS Workforce induction and site inductions are listed here." />
      {worker.role === "worker" ? (
        <InductionBook rows={rows} sites={inductionPickerSites(offers, rows)} />
      ) : (
        <p className="text-sm">Admin accounts do not keep inductions here.</p>
      )}
    </div>
  )
}
