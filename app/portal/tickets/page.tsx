import type { Metadata } from "next"
import { Heading, StatusChip } from "@/components/portal/ui"
import { complianceFor } from "@/lib/portal/services"
import { sydneyToday } from "@/lib/portal/dates"
import { signedFilePath } from "@/lib/portal/files"
import { signingSecret } from "@/lib/portal/config"
import { requireUser } from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"
import { TicketEditor } from "@/components/portal/TicketEditor"
import Link from "next/link"

export const metadata: Metadata = { title: "Your cards" }

export default async function TicketsPage() {
  const { worker } = await requireUser()
  const today = sydneyToday()
  const check = complianceFor(worker, today)
  const docs = (await (await getStore()).documents.all()).filter((doc) => doc.workerId === worker.id && !doc.deletedAt)
  return (
    <div className="space-y-4">
      <Heading kicker="Tickets" title="Your cards" text="A White card is required on every job. Changing a card sends it back for MS Workforce to check." />
      <ul className="space-y-2">
        {check.tickets.map((ticket) => {
          const status = worker.tickets[ticket.type]?.status || "No"
          return (
            <li key={ticket.type} className="flex items-center justify-between gap-2 rounded-2xl bg-white px-3 py-3">
              <span className="text-sm font-semibold">{ticket.label}</span>
              <StatusChip
                level={
                  status === "Yes, I have it"
                    ? worker.ticketsVerified
                      ? "ok"
                      : "pending"
                    : ticket.type === "whiteCard"
                      ? "do-not-book"
                      : "neutral"
                }
              >
                {status}
              </StatusChip>
            </li>
          )
        })}
      </ul>
      {docs.map((doc) => (
        <a key={doc.id} className="block text-sm font-semibold text-teal-600 underline" href={signedFilePath(doc.id, Date.now(), signingSecret())}>
          View uploaded file
        </a>
      ))}
      <TicketEditor />
      <Link href="/candidates" className="text-sm font-semibold text-teal-600 underline">
        Training providers
      </Link>
    </div>
  )
}
