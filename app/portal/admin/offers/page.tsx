import type { Metadata } from "next"
import Link from "next/link"
import { OfferComposer } from "@/components/portal/AdminForms"
import { Heading, StatusChip } from "@/components/portal/ui"
import { complianceFor } from "@/lib/portal/services"
import { formatDate } from "@/lib/portal/dates"
import { sydneyToday } from "@/lib/portal/dates"
import { requireAdmin } from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"

export const metadata: Metadata = { title: "Send a shift" }

export default async function AdminOffersPage() {
  await requireAdmin()
  const store = await getStore()
  const today = sydneyToday()
  const workers = (await store.workers.all())
    .filter((worker) => worker.role === "worker")
    .map((worker) => ({ id: worker.id, name: worker.name, label: complianceFor(worker, today).label }))
  const offers = await store.offers.all()
  const names = new Map((await store.workers.all()).map((worker) => [worker.id, worker.name]))
  return (
    <div className="space-y-4">
      <Heading kicker="Offers" title="Send a shift" text="White card is always required. DO NOT BOOK workers are skipped." />
      <OfferComposer workers={workers} />
      <h2 className="text-sm font-semibold">Who answered</h2>
      <ul className="space-y-2">
        {offers.map((offer) => (
          <li key={offer.id} className="flex items-center justify-between gap-2 rounded-2xl bg-white px-3 py-2 text-sm">
            <Link href={"/portal/offers/" + offer.id}>
              <span className="font-semibold">{names.get(offer.workerId)}</span>
              <span className="block text-navy/70">
                {offer.suburb} · {formatDate(offer.shiftDate)}
              </span>
            </Link>
            <StatusChip level={offer.status === "Accepted" ? "ok" : offer.status === "Offered" ? "pending" : "neutral"}>{offer.status}</StatusChip>
          </li>
        ))}
      </ul>
    </div>
  )
}
