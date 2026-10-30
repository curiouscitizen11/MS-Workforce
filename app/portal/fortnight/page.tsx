import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Heading } from "@/components/portal/ui"
import { formatDate, sydneyToday } from "@/lib/portal/dates"
import { fortnightSummary } from "@/lib/portal/home"
import { formatHours } from "@/lib/portal/hours"
import { datesInFortnight, fortnightContaining } from "@/lib/portal/pay"
import { requireUser } from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"

export const metadata: Metadata = { title: "This fortnight" }

export default async function FortnightPage() {
  const { worker } = await requireUser()
  if (worker.role !== "worker") redirect("/portal/admin")
  const today = sydneyToday()
  const fortnight = fortnightContaining(today)
  const offers = (await (await getStore()).offers.all()).filter((offer) => offer.workerId === worker.id)
  const sheets = (await (await getStore()).timesheets.all()).filter((sheet) => sheet.workerId === worker.id)
  const summary = fortnightSummary(offers, sheets, worker.id, today)
  return (
    <div className="space-y-4">
      <Heading kicker="Hours" title={formatDate(fortnight.start) + " to " + formatDate(fortnight.end)} text={formatHours(summary.approvedHours) + " h approved. Pay day " + formatDate(fortnight.payDay) + "."} />
      <ul className="portal-list">
        {datesInFortnight(fortnight).map((day) => {
          const sheet = sheets.find((item) => item.workDate === day && item.status !== "Draft")
          const onShift = offers.some((offer) => offer.status === "Accepted" && offer.shiftDate === day)
          const label = sheet ? formatHours(sheet.totalHours) + " h · " + sheet.status : onShift ? "Not signed" : "—"
          const row = (
            <>
              <span className="portal-list-label">{formatDate(day)}</span>
              <span className="portal-list-status">{label}</span>
            </>
          )
          return (
            <li key={day}>
              {sheet ? (
                <Link href={"/portal/timesheet/" + sheet.id} className="portal-list-row">
                  {row}
                </Link>
              ) : (
                <div className="portal-list-row">{row}</div>
              )}
            </li>
          )
        })}
      </ul>
      <Link href="/portal" className="pill pill-line-dark w-full">
        Back to Home
      </Link>
    </div>
  )
}
