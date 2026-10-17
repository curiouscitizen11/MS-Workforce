import { DemoBanner, Heading, StatusChip } from "@/components/portal/ui"
import { isMock } from "@/lib/portal/config"
import { formatDate } from "@/lib/portal/dates"
import { requireUser } from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"
import { notFound } from "next/navigation"

export default async function SignedTimesheetPage({ params }: { params: { id: string } }) {
  const { worker } = await requireUser()
  const sheet = await (await getStore()).timesheets.get(params.id)
  if (!sheet || (worker.role !== "admin" && sheet.workerId !== worker.id)) notFound()
  return (
    <div className="space-y-4">
      <DemoBanner mock={isMock()} />
      <div className="flex items-start justify-between gap-3">
        <Heading kicker="Timesheet" title={formatDate(sheet.workDate)} text={sheet.workerName} />
        <StatusChip level={sheet.status === "Approved" ? "ok" : "pending"}>{sheet.status === "Approved" ? "Approved" : "Draft"}</StatusChip>
      </div>
      <p className="text-5xl font-semibold tracking-tight">{sheet.totalHours} hours</p>
      <dl className="grid grid-cols-3 gap-2 rounded-2xl border border-navy/10 bg-white p-4 text-sm">
        <div>
          <dt className="text-navy/60">Start</dt>
          <dd className="font-semibold">{sheet.start}</dd>
        </div>
        <div>
          <dt className="text-navy/60">Finish</dt>
          <dd className="font-semibold">{sheet.finish}</dd>
        </div>
        <div>
          <dt className="text-navy/60">Break</dt>
          <dd className="font-semibold">{sheet.breakMinutes} min</dd>
        </div>
      </dl>
      {sheet.signaturePng ? (
        <section className="rounded-2xl border border-navy/10 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy/60">Supervisor signature</p>
          <p className="mt-1 font-semibold">{sheet.supervisorName}</p>
          <p className="text-sm text-navy/70">{sheet.supervisorRole}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sheet.signaturePng} alt={"Signature of " + (sheet.supervisorName || "the supervisor")} className="mt-2 h-20 w-full object-contain" />
          <p className="mt-2 text-sm leading-relaxed">This signature is the approval. A confirmation email has been sent.</p>
        </section>
      ) : null}
      <p className="text-sm text-navy/70">Pay is fortnightly, on Thursday. Tax, bank and super details stay in Xero.</p>
    </div>
  )
}
