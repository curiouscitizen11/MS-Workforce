import type { Metadata } from "next"
import { TimesheetAdmin } from "@/components/portal/TimesheetAdmin"
import { DemoBanner, Heading } from "@/components/portal/ui"
import { isMock } from "@/lib/portal/config"
import { formatDate } from "@/lib/portal/dates"
import { formatHours } from "@/lib/portal/hours"
import { MS_PHONE, cutoffMessage } from "@/lib/portal/pay"
import { requireUser } from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"
import Link from "next/link"
import { notFound } from "next/navigation"

export const metadata: Metadata = { title: "Signed hours" }

export default async function SignedTimesheetPage({ params }: { params: { id: string } }) {
  const { worker } = await requireUser()
  const store = await getStore()
  const sheet = await store.timesheets.get(params.id)
  if (!sheet || (worker.role !== "admin" && sheet.workerId !== worker.id)) notFound()
  const mine = (await store.timesheets.all()).filter(
    (item) => item.workerId === sheet.workerId && item.status === "Approved" && item.payFortnight === sheet.payFortnight,
  )
  const total = Math.round(mine.reduce((sum, item) => sum + item.totalHours, 0) * 100) / 100
  const late = cutoffMessage({
    start: "",
    end: "",
    payDay: sheet.payDay || "",
    label: sheet.payFortnight || "",
    afterCutoff: Boolean(sheet.afterCutoff),
  })
  return (
    <div className="space-y-4">
      <DemoBanner mock={isMock()} />
      <Heading
        kicker="Timesheet"
        title={"Signed and sent. " + formatHours(sheet.totalHours) + " hours on " + formatDate(sheet.workDate) + "."}
        text={sheet.workerName + " · MS Workforce"}
      />
      <p className="text-sm font-semibold" data-testid="fortnight-total">
        This fortnight: {formatHours(total)} hours so far · Pay day: Thursday {formatDate(sheet.payDay || "")}
      </p>
      {late ? <p className="rounded-2xl bg-[#FEF3C7] px-3 py-3 text-sm font-semibold text-[#B45309]">{late}</p> : null}
      <dl className="grid grid-cols-3 gap-2 rounded-2xl border border-navy/10 bg-white p-3 text-sm">
        <div>
          <dt className="text-navy/70">Start</dt>
          <dd className="font-semibold">{sheet.start}</dd>
        </div>
        <div>
          <dt className="text-navy/70">Finish</dt>
          <dd className="font-semibold">{sheet.finish}</dd>
        </div>
        <div>
          <dt className="text-navy/70">Break</dt>
          <dd className="font-semibold">{sheet.breakMinutes === 30 ? "30-minute break" : sheet.breakMinutes + " min"}</dd>
        </div>
      </dl>
      <p className="text-sm">
        {sheet.siteName || sheet.suburb} · {sheet.status}
        {sheet.signerMismatch ? " · Different signer" : ""}
        {sheet.incident ? " · Incident reported" : ""}
        {sheet.corrected ? " · Corrected by MS Workforce" : ""}
      </p>
      {sheet.signaturePng ? (
        <section className="rounded-2xl border border-navy/10 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy/70">Supervisor signature</p>
          <p className="mt-1 font-semibold">{sheet.supervisorName}</p>
          <p className="text-sm text-navy/70">{sheet.supervisorRole}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sheet.signaturePng} alt={"Signature of " + (sheet.supervisorName || "the supervisor")} className="mt-2 h-16 w-full rounded-md bg-[#0b1a2e] object-contain" />
        </section>
      ) : null}
      <p className="text-sm leading-relaxed">Something wrong? Call MS Workforce on {MS_PHONE}.</p>
      <Link href="/portal" className="pill pill-teal w-full">
        Back to home
      </Link>
      {worker.role === "admin" ? <TimesheetAdmin sheetId={sheet.id} start={sheet.start} finish={sheet.finish} /> : null}
    </div>
  )
}
