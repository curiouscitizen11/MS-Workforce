import type { Metadata } from "next"
import Link from "next/link"
import { Heading, StatusChip } from "@/components/portal/ui"
import {
  cellMarks,
  dayAria,
  dayEntries,
  monthCells,
  monthTitle,
  resolveView,
  shiftMonth,
  monthKey,
  type SheetMark,
} from "@/lib/portal/calendar"
import { formatDate, formatTime } from "@/lib/portal/dates"
import { formatHours } from "@/lib/portal/hours"
import { requireUser } from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"

export const metadata: Metadata = { title: "Offers and shifts" }

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

function TimesheetMark({ mark }: { mark: SheetMark }) {
  if (mark === "future" || mark === "none") return null
  const symbol = mark === "approved" ? "✓" : mark === "submitted" ? "◷" : "!"
  const label = mark === "approved" ? "Approved" : mark === "submitted" ? "Submitted" : mark === "queried" ? "Queried" : "Not signed"
  return (
    <span className="portal-cal-sym">
      <span aria-hidden="true">{symbol}</span>
      <span className="sr-only">{label}</span>
    </span>
  )
}

export default async function OffersPage({ searchParams }: { searchParams: { month?: string; day?: string } }) {
  const { worker } = await requireUser()
  const offers = (await (await getStore()).offers.all())
    .filter((offer) => worker.role === "admin" || offer.workerId === worker.id)
    .sort((a, b) => b.shiftDate.localeCompare(a.shiftDate))
  const list = (
    <ul className="space-y-2">
      {offers.map((offer) => (
        <li key={offer.id}>
          <Link href={(offer.status === "Accepted" ? "/portal/shifts/" : "/portal/offers/") + offer.id} className="block rounded-2xl bg-white p-4">
            <span className="flex items-center justify-between gap-2">
              <span className="font-semibold">{offer.roleName}</span>
              <StatusChip level={offer.status === "Accepted" ? "ok" : offer.status === "Offered" ? "pending" : "neutral"}>{offer.status}</StatusChip>
            </span>
            <span className="mt-1 block text-sm text-navy/70">
              {offer.suburb} · {formatDate(offer.shiftDate)} · {formatTime(offer.startTime)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
  if (worker.role === "admin") {
    return (
      <div className="space-y-4">
        <Heading kicker="Shifts" title="Offers and shifts" />
        {list}
      </div>
    )
  }

  const sheets = (await (await getStore()).timesheets.all()).filter((sheet) => sheet.workerId === worker.id)
  const view = resolveView(searchParams.month, searchParams.day)
  const cells = monthCells(view.month)
  const selected = view.day ? dayEntries(offers, sheets, worker.id, view.day, view.today) : []
  return (
    <div className="space-y-4">
      <Heading kicker="Shifts" title="Offers and shifts" />
      <section className="portal-cal" aria-label="Shift calendar">
        <div className="portal-cal-nav">
          <Link href={"/portal/offers?month=" + shiftMonth(view.month, -1)} className="pill pill-line-dark px-3">
            Previous
          </Link>
          <p className="text-sm font-semibold">{monthTitle(view.month)}</p>
          <Link href={"/portal/offers?month=" + shiftMonth(view.month, 1)} className="pill pill-line-dark px-3">
            Next
          </Link>
        </div>
        <Link href={"/portal/offers?month=" + monthKey(view.today) + "&day=" + view.today} className="pill pill-line-dark px-3">
          Today
        </Link>
        <div className="portal-cal-grid">
          {WEEKDAYS.map((name) => (
            <div key={name} className="portal-cal-dow">
              {name}
            </div>
          ))}
          {cells.map((date, index) => {
            if (!date) return <div key={"blank-" + index} />
            const entries = dayEntries(offers, sheets, worker.id, date, view.today)
            const marks = cellMarks(entries)
            const on = date === view.day
            return (
              <Link
                key={date}
                href={"/portal/offers?month=" + view.month + "&day=" + date}
                aria-label={dayAria(date, entries, view.today)}
                aria-current={on ? "date" : undefined}
                className={"portal-cal-day" + (date === view.today ? " portal-cal-now" : "") + (on ? " portal-cal-on" : "")}
              >
                <span className="portal-cal-num">{Number(date.slice(8))}</span>
                <span className="portal-cal-marks">
                  {marks.accepted ? <span className="portal-dot" aria-hidden="true" /> : null}
                  {marks.offered ? <span className="portal-dot portal-dot-hollow" aria-hidden="true" /> : null}
                  <TimesheetMark mark={marks.mark} />
                </span>
              </Link>
            )
          })}
        </div>
      </section>
      {view.day ? (
        <section className="rounded-2xl border border-navy/10 bg-white p-4" aria-label={formatDate(view.day)}>
          <h2 className="text-base font-semibold">{formatDate(view.day)}</h2>
          {selected.length === 0 ? <p className="mt-2 text-sm">Nothing on this day.</p> : null}
          <ul className="mt-3 space-y-3">
            {selected.map((entry) => {
              const shiftHref = (entry.offer.status === "Accepted" ? "/portal/shifts/" : "/portal/offers/") + entry.offer.id
              return (
                <li key={entry.offer.id} className="text-sm">
                  <Link href={shiftHref} className="font-semibold">
                    {entry.offer.roleName}
                  </Link>
                  <p className="mt-1">{formatTime(entry.offer.startTime)}</p>
                  <p>{[entry.offer.siteName, entry.offer.suburb].filter(Boolean).join(", ")}</p>
                  {entry.offer.status === "Accepted" && entry.offer.address ? <p>{entry.offer.address}</p> : null}
                  {entry.sheet ? (
                    <p className="mt-1">
                      {entry.sheet.status} · {formatHours(entry.sheet.totalHours)} h ·{" "}
                      <Link href={"/portal/timesheet/" + entry.sheet.id} className="font-semibold text-teal-600 underline">
                        Open timesheet
                      </Link>
                    </p>
                  ) : (
                    <p className="mt-1">
                      <Link href="/portal/timesheet" className="font-semibold text-teal-600 underline">
                        Log hours
                      </Link>
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}
      {list}
    </div>
  )
}
