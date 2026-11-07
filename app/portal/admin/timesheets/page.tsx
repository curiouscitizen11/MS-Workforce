import type { Metadata } from "next"
import Link from "next/link"
import { Heading, StatusChip } from "@/components/portal/ui"
import { formatDate } from "@/lib/portal/dates"
import { formatHours } from "@/lib/portal/hours"
import { workDoneText } from "@/lib/portal/work-done"
import { payRunFortnight } from "@/lib/portal/pay"
import { requireAdmin } from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"

export const metadata: Metadata = { title: "Pay run" }

export default async function AdminTimesheetsPage() {
  await requireAdmin()
  const fortnight = payRunFortnight(new Date())
  const sheets = (await (await getStore()).timesheets.all()).filter((sheet) => sheet.payFortnight === fortnight.label)
  const approved = sheets.filter((sheet) => sheet.status === "Approved")
  const totals = new Map<string, number>()
  for (const sheet of approved) totals.set(sheet.workerName, (totals.get(sheet.workerName) || 0) + sheet.totalHours)
  return (
    <div className="space-y-4">
      <Heading kicker="Pay run" title={fortnight.label} text="Approved hours only. Pay day Thursday. Overtime stays in Xero." />
      <ul className="space-y-2">
        {Array.from(totals.entries()).map(([name, hours]) => (
          <li key={name} className="flex items-center justify-between rounded-2xl bg-white px-3 py-3 text-sm font-semibold">
            <span>{name}</span>
            <span>{formatHours(hours)} hours</span>
          </li>
        ))}
      </ul>
      <ul className="space-y-2">
        {sheets.map((sheet) => {
          const flags = [
            sheet.totalHours > 12 ? "Over 12 hours" : "",
            sheet.totalHours < 4 ? "Under 4 hours" : "",
            sheet.signerMismatch ? "Different signer" : "",
            sheet.incident ? "Incident" : "",
            sheet.corrected ? "Corrected by MS Workforce" : "",
            sheet.signaturePng ? "" : "No supervisor signature",
          ].filter(Boolean)
          return (
            <li key={sheet.id}>
              <Link href={"/portal/timesheet/" + sheet.id} className="block rounded-2xl bg-white px-3 py-3">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{sheet.workerName}</span>
                  <StatusChip level={sheet.status === "Approved" ? "ok" : "pending"}>{sheet.status}</StatusChip>
                </span>
                <span className="mt-1 block text-xs text-navy/70">
                  {formatDate(sheet.workDate)} · {formatHours(sheet.totalHours)} hours
                  {flags.length ? " · " + flags.join(" · ") : ""}
                </span>
                <span className="mt-1 block text-sm">{workDoneText(sheet.tasks, sheet.taskNote)}</span>
              </Link>
            </li>
          )
        })}
      </ul>
      <a className="pill pill-teal w-full" href="/api/portal/admin/xero">
        Export for Xero
      </a>
    </div>
  )
}
