import type { Metadata } from "next"
import { VerifyPanel } from "@/components/portal/AdminForms"
import { HeadshotReview } from "@/components/portal/HeadshotReview"
import { TicketCheckList, type TicketCheckItem } from "@/components/portal/TicketCheck"
import { Heading, StatusChip, badgeLevel } from "@/components/portal/ui"
import { signingSecret } from "@/lib/portal/config"
import { complianceFor } from "@/lib/portal/services"
import { formatDate, sydneyParts, sydneyToday } from "@/lib/portal/dates"
import { signedFilePath } from "@/lib/portal/files"
import { formatAuMobile } from "@/lib/portal/phone"
import { requireAdmin } from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"
import { approvedHeadshot, pendingHeadshot, workerInitials } from "@/lib/portal/headshot"
import { isTicketType, latestPhoto, slotsFromWorker } from "@/lib/portal/ticket-photos"
import { notFound } from "next/navigation"

export const metadata: Metadata = { title: "Worker" }

export default async function AdminWorkerPage({ params }: { params: { id: string } }) {
  await requireAdmin()
  const store = await getStore()
  const worker = await store.workers.get(params.id)
  if (!worker || worker.role === "admin") notFound()
  const today = sydneyToday()
  const check = complianceFor(worker, today)
  const docs = await store.documents.all()
  const now = Date.now()
  const secret = signingSecret()
  const items: TicketCheckItem[] = slotsFromWorker(worker).map((slot) => {
    const record = isTicketType(slot.key) ? worker.tickets[slot.key] : worker.licenceChecks?.[slot.key]
    const deleted = record?.photosDeletedAt
    const front = latestPhoto(docs, worker.id, slot.key, "front")
    const back = latestPhoto(docs, worker.id, slot.key, "back")
    const both = Boolean(front && back && !deleted)
    return {
      key: slot.key,
      label: slot.label,
      number: record?.number || "",
      expiry: record?.expiry || "",
      checkedBy: record?.checkedBy,
      checkedAtLabel: record?.checkedAt ? formatDate(sydneyParts(new Date(record.checkedAt)).iso) : undefined,
      photosDeletedAt: deleted ? formatDate(deleted) : undefined,
      frontUrl: front && !deleted ? signedFilePath(front.id, now, secret) : undefined,
      backUrl: back && !deleted ? signedFilePath(back.id, now, secret) : undefined,
      ready: both || Boolean(record?.checkedAt),
    }
  })
  const ordered = [...items].sort((a, b) => {
    const rank = (item: TicketCheckItem) => {
      const photos = Boolean(item.frontUrl && item.backUrl)
      if (photos && !item.checkedBy) return 0
      if (photos && item.checkedBy) return 1
      if (!item.checkedBy) return 2
      return 3
    }
    return rank(a) - rank(b)
  })
  return (
    <div className="space-y-4">
      <Heading kicker={worker.status} title={worker.name} text={worker.suburb || ""} />
      <StatusChip level={badgeLevel(check.badge)}>{check.label}</StatusChip>
      {worker.invitedAs ? <p className="portal-banner text-sm">{worker.invitedAs}</p> : null}
      <a className="pill pill-teal w-full" href={"tel:" + worker.mobile}>
        Call {formatAuMobile(worker.mobile)}
      </a>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Headshot</h2>
        {pendingHeadshot(docs, worker.id) ? (
          <HeadshotReview
            id={pendingHeadshot(docs, worker.id)!.id}
            name={worker.name}
            url={signedFilePath(pendingHeadshot(docs, worker.id)!.id, now, secret)}
          />
        ) : approvedHeadshot(docs, worker.id) ? (
          <figure className="space-y-2 rounded-2xl bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signedFilePath(approvedHeadshot(docs, worker.id)!.id, now, secret)}
              alt={"Approved headshot of " + worker.name}
              className="mx-auto h-36 w-36 rounded-full object-cover"
            />
            <figcaption className="text-center text-sm font-semibold">Approved</figcaption>
          </figure>
        ) : (
          <p className="rounded-2xl bg-white p-4 text-sm">
            {workerInitials(worker.name)} · Photo pending
          </p>
        )}
      </section>
      <TicketCheckList workerId={worker.id} items={ordered} />
      <section className="space-y-2 rounded-2xl border border-navy/10 bg-white p-4">
        <h2 className="text-sm font-semibold">Safety info</h2>
        <p className="text-xs leading-relaxed text-navy/70">Private. Only you and this worker can see it. It is not on the ID card.</p>
        <p className="text-sm">Emergency contact: {worker.emergencyContact || "Not added"} {worker.emergencyPhone ? "· " + worker.emergencyPhone : ""}</p>
        <p className="text-sm">Allergies: {worker.allergies || "Not added"}</p>
        <p className="text-sm">Who may see this: {worker.medicalSharing || "Not added"}</p>
      </section>
      <VerifyPanel workerId={worker.id} visa={worker.rtw === "Visa holder"} />
    </div>
  )
}
