import type { Metadata } from "next"
import { Heading } from "@/components/portal/ui"
import { TicketBook } from "@/components/portal/TicketBook"
import { sydneyToday } from "@/lib/portal/dates"
import { requireUser } from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"
import Link from "next/link"

export const metadata: Metadata = { title: "Tickets & training" }

export default async function TicketsPage() {
  const { worker } = await requireUser()
  const today = sydneyToday()
  const photos = (await (await getStore()).documents.all())
    .filter((doc) => doc.workerId === worker.id && doc.kind === "ticket" && !doc.deletedAt && doc.licenceKey && doc.side)
    .map((doc) => ({ key: doc.licenceKey as string, side: doc.side as "front" | "back" }))
  return (
    <div className="space-y-4">
      <Heading
        kicker="Tickets & training"
        title="Your cards and certificates"
        text="Your list shows only what you have added. A White card is always there, because every job needs one. Tap a row to change it. Licences ask for an expiry when the card has one. Asbestos awareness, silica awareness and manual handling are training certificates, so they do not ask for an expiry. Add the front and the back. MS Workforce checks them against the photos. Changing a number, expiry or photo sends the card back for a new check. You cannot open the photos after they are saved."
      />
      <TicketBook
        today={today}
        tickets={worker.tickets}
        otherHeld={worker.otherTicketsHeld || []}
        otherDetails={worker.licenceChecks || {}}
        photos={photos}
      />
      <Link href="/candidates" className="text-sm font-semibold text-teal-600 underline">
        Training providers
      </Link>
    </div>
  )
}
