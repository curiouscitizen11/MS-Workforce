import type { Metadata } from "next"
import { Heading, StatusChip } from "@/components/portal/ui"
import { complianceFor } from "@/lib/portal/services"
import { sydneyToday } from "@/lib/portal/dates"
import { requireUser } from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"
import { TicketEditor } from "@/components/portal/TicketEditor"
import Link from "next/link"

export const metadata: Metadata = { title: "Your cards" }

export default async function TicketsPage() {
  const { worker } = await requireUser()
  const today = sydneyToday()
  const check = complianceFor(worker, today)
  const photos = (await (await getStore()).documents.all())
    .filter((doc) => doc.workerId === worker.id && doc.kind === "ticket" && !doc.deletedAt && doc.licenceKey && doc.side)
    .map((doc) => ({ key: doc.licenceKey as string, side: doc.side as "front" | "back" }))
  return (
    <div className="space-y-4">
      <Heading kicker="Tickets" title="Your cards" text="A White card is required on every job. If you have a card, add the front and the back. Changing a card sends it back for MS Workforce to check. You cannot open the photos after they are saved." />
      <ul className="space-y-2">
        {check.tickets.map((ticket) => {
          const record = worker.tickets[ticket.type]
          const status = record?.status || "No"
          const held = status === "Yes, I have it"
          const checked = Boolean(record?.checkedAt)
          return (
            <li key={ticket.type} className="flex items-center justify-between gap-2 rounded-2xl bg-white px-3 py-3">
              <span className="text-sm font-semibold">{ticket.label}</span>
              <StatusChip level={held ? (checked ? "ok" : "pending") : ticket.type === "whiteCard" ? "do-not-book" : "neutral"}>
                {held ? (checked ? "Checked" : "Waiting for a check") : status}
              </StatusChip>
            </li>
          )
        })}
      </ul>
      <TicketEditor photos={photos} otherHeld={worker.otherTicketsHeld || []} />
      <Link href="/candidates" className="text-sm font-semibold text-teal-600 underline">
        Training providers
      </Link>
    </div>
  )
}
