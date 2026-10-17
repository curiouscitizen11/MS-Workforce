import { OfferActions } from "@/components/portal/OfferActions"
import { DemoBanner, Heading, StatusChip, badgeLevel } from "@/components/portal/ui"
import { isMock } from "@/lib/portal/config"
import { asTicketInputs, canAcceptShift } from "@/lib/portal/compliance"
import { formatDate, formatTime } from "@/lib/portal/dates"
import { TICKET_LABELS } from "@/lib/portal/types"
import { requireUser } from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"
import { notFound } from "next/navigation"

export default async function OfferPage({ params }: { params: { id: string } }) {
  const { worker } = await requireUser()
  const store = await getStore()
  const offer = await store.offers.get(params.id)
  if (!offer || (worker.role !== "admin" && offer.workerId !== worker.id)) notFound()
  const owner = worker.role === "admin" ? await store.workers.get(offer.workerId) : worker
  const check = owner
    ? canAcceptShift({ tickets: asTicketInputs(owner.tickets), jobDate: offer.shiftDate, required: offer.requiredTickets })
    : { ok: false as const, message: "Call Mav." }
  const showAddress = offer.status === "Accepted"
  return (
    <div className="space-y-4">
      <DemoBanner mock={isMock()} />
      <Heading kicker="Shift offer" title={offer.roleName} text={offer.placementRef} />
      <section className="rounded-2xl border border-navy/10 bg-white p-4 text-sm leading-relaxed">
        <p className="text-lg font-semibold">{offer.suburb}</p>
        <p>{formatDate(offer.shiftDate)}</p>
        <p>Start {formatTime(offer.startTime)}</p>
        <p>About {offer.expectedHours} hours</p>
        <p className="font-semibold">{offer.rateToWorker}</p>
        <p className="mt-2">Tickets: {offer.requiredTickets.map((type) => TICKET_LABELS[type]).join(", ")}</p>
        {offer.ppe ? <p>PPE: {offer.ppe}</p> : null}
        {showAddress && offer.address ? <p className="mt-2">{offer.address}</p> : <p className="mt-2 text-navy/70">The street address shows after you accept.</p>}
      </section>
      {offer.status === "Offered" ? (
        <>
          <StatusChip level={check.ok ? badgeLevel(check.badge) : "do-not-book"}>{check.ok ? check.label : "Cannot accept"}</StatusChip>
          <OfferActions offerId={offer.id} blocked={check.ok ? undefined : check.message} />
        </>
      ) : (
        <StatusChip level={offer.status === "Accepted" ? "ok" : "neutral"}>{offer.status}</StatusChip>
      )}
    </div>
  )
}
