import type { Metadata } from "next"
import { VerifyPanel } from "@/components/portal/AdminForms"
import { Heading, StatusChip, badgeLevel } from "@/components/portal/ui"
import { signingSecret } from "@/lib/portal/config"
import { complianceFor } from "@/lib/portal/services"
import { sydneyToday } from "@/lib/portal/dates"
import { signedFilePath } from "@/lib/portal/files"
import { formatAuMobile } from "@/lib/portal/phone"
import { requireAdmin } from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"
import { TICKET_LABELS, TICKET_TYPES } from "@/lib/portal/types"
import { notFound } from "next/navigation"

export const metadata: Metadata = { title: "Worker" }

export default async function AdminWorkerPage({ params }: { params: { id: string } }) {
  await requireAdmin()
  const store = await getStore()
  const worker = await store.workers.get(params.id)
  if (!worker || worker.role === "admin") notFound()
  const check = complianceFor(worker, sydneyToday())
  const docs = (await store.documents.all()).filter((doc) => doc.workerId === worker.id && !doc.deletedAt)
  return (
    <div className="space-y-4">
      <Heading kicker={worker.status} title={worker.name} text={worker.suburb || ""} />
      <StatusChip level={badgeLevel(check.badge)}>{check.label}</StatusChip>
      <a className="pill pill-teal w-full" href={"tel:" + worker.mobile}>
        Call {formatAuMobile(worker.mobile)}
      </a>
      <ul className="space-y-2 rounded-2xl bg-white p-4 text-sm">
        {TICKET_TYPES.map((type) => (
          <li key={type} className="flex justify-between gap-2">
            <span>{TICKET_LABELS[type]}</span>
            <span className="font-semibold">{worker.tickets[type].status || "Not held"}{worker.tickets[type].expiry ? " · " + worker.tickets[type].expiry : ""}</span>
          </li>
        ))}
      </ul>
      {docs.map((doc) => (
        <a key={doc.id} className="block text-sm font-semibold text-teal-600 underline" href={signedFilePath(doc.id, Date.now(), signingSecret())}>
          Open private file ({doc.kind})
        </a>
      ))}
      <VerifyPanel workerId={worker.id} visa={worker.rtw === "Visa - VEVO"} />
    </div>
  )
}
