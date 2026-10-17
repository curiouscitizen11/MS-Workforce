import Link from "next/link"
import { Heading, StatusChip } from "@/components/portal/ui"
import { formatDate, formatTime } from "@/lib/portal/dates"
import { requireUser } from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"

export default async function OffersPage() {
  const { worker } = await requireUser()
  const offers = (await (await getStore()).offers.all())
    .filter((offer) => worker.role === "admin" || offer.workerId === worker.id)
    .sort((a, b) => b.shiftDate.localeCompare(a.shiftDate))
  return (
    <div className="space-y-4">
      <Heading kicker="Shifts" title="Offers and shifts" />
      <ul className="space-y-2">
        {offers.map((offer) => (
          <li key={offer.id}>
            <Link href={(offer.status === "Accepted" ? "/portal/shifts/" : "/portal/offers/") + offer.id} className="block rounded-2xl bg-white p-4">
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold">{offer.roleName}</span>
                <StatusChip level={offer.status === "Accepted" ? "ok" : offer.status === "Offered" ? "pending" : "neutral"}>{offer.status}</StatusChip>
              </span>
              <span className="mt-1 block text-sm text-navy/70">
                {offer.suburb} · {formatDate(offer.shiftDate)} · {formatTime(offer.startTime)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
