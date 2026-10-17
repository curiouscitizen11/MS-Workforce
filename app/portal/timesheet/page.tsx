import { TimesheetForm } from "@/components/portal/TimesheetForm"
import { Heading } from "@/components/portal/ui"
import { formatDate, sydneyToday } from "@/lib/portal/dates"
import { datesInFortnight, fortnightContaining } from "@/lib/portal/pay"
import { requireUser } from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"
import Link from "next/link"

export default async function TimesheetPage() {
  const { worker } = await requireUser()
  const store = await getStore()
  const today = sydneyToday()
  const offers = (await store.offers.all()).filter((offer) => offer.workerId === worker.id && offer.status === "Accepted")
  const sheets = (await store.timesheets.all()).filter((sheet) => sheet.workerId === worker.id)
  const fortnight = fortnightContaining(today)
  const days = datesInFortnight(fortnight)
  return (
    <div className="space-y-4">
      <Heading kicker="Hours" title="Log today's hours" text="Enter the times at the end of the day. No GPS. MS Workforce." />
      <TimesheetForm
        today={today}
        workerName={worker.name}
        shifts={offers.map((offer) => ({
          id: offer.id,
          workDate: offer.shiftDate,
          siteName: offer.siteName || offer.suburb,
          suburb: offer.suburb,
          builder: offer.siteContact || "Site",
          start: offer.startTime,
          finish: offer.usualFinish || "15:30",
          breakMinutes: offer.usualBreak ?? 30,
          signer: offer.timesheetSigner || offer.siteContact || "",
          signerRole: offer.signerRole || "Site supervisor",
        }))}
      />
      <section className="rounded-2xl border border-navy/10 bg-white p-3">
        <h2 className="text-sm font-semibold">This fortnight</h2>
        <ul className="mt-2 space-y-1">
          {days.map((day) => {
            const sheet = sheets.find((item) => item.workDate === day && item.status !== "Draft")
            const shift = offers.some((offer) => offer.shiftDate === day)
            const label = sheet ? sheet.status : shift ? "Not signed" : "No shift"
            return (
              <li key={day} className="flex items-center justify-between gap-2 text-sm">
                <span>{formatDate(day)}</span>
                {sheet ? (
                  <Link href={"/portal/timesheet/" + sheet.id} className="font-semibold text-teal-600">
                    {label}
                  </Link>
                ) : (
                  <span className="text-navy/60">{label}</span>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
