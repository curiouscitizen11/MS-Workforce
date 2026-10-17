import Link from "next/link"
import { Heading, StatusChip } from "@/components/portal/ui"
import { formatDate } from "@/lib/portal/dates"
import { requireAdmin } from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"

export default async function AdminTimesheetsPage() {
  await requireAdmin()
  const sheets = (await (await getStore()).timesheets.all()).sort((a, b) => b.workDate.localeCompare(a.workDate))
  return (
    <div className="space-y-4">
      <Heading kicker="Hours" title="Signed timesheets" text="The supervisor's signature is the approval." />
      <ul className="space-y-2">
        {sheets.map((sheet) => (
          <li key={sheet.id}>
            <Link href={"/portal/timesheet/" + sheet.id} className="flex items-center justify-between gap-2 rounded-2xl bg-white px-3 py-3">
              <span>
                <span className="block text-sm font-semibold">{sheet.workerName}</span>
                <span className="block text-xs text-navy/60">
                  {formatDate(sheet.workDate)} · {sheet.totalHours} hours
                </span>
              </span>
              <StatusChip level={sheet.status === "Approved" ? "ok" : "pending"}>{sheet.status}</StatusChip>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
