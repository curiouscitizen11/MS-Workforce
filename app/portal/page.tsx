import type { Metadata } from "next"
import Link from "next/link"
import { DemoBanner, Heading, StatusChip, badgeLevel } from "@/components/portal/ui"
import { isMock } from "@/lib/portal/config"
import { complianceFor } from "@/lib/portal/services"
import { formatDate, formatTime, sydneyParts, sydneyToday } from "@/lib/portal/dates"
import { formatHours } from "@/lib/portal/hours"
import { datesInFortnight, fortnightContaining } from "@/lib/portal/pay"
import { requireUser } from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"

export const metadata: Metadata = { title: "Home" }

export default async function DashboardPage() {
  const { worker } = await requireUser()
  if (worker.role === "admin") {
    return (
      <div className="space-y-4">
        <Heading kicker="Admin" title={"G'day, " + worker.name} text="Offers, tickets and signed hours are in Admin." />
        <Link href="/portal/admin" className="pill pill-teal w-full">
          Open admin
        </Link>
      </div>
    )
  }
  const store = await getStore()
  const now = new Date()
  const today = sydneyToday(now)
  const afternoon = sydneyParts(now).minutes >= 14 * 60
  const fortnight = fortnightContaining(today)
  const check = complianceFor(worker, today)
  const offers = (await store.offers.all()).filter((offer) => offer.workerId === worker.id)
  const open = offers.find((offer) => offer.status === "Offered")
  const todayShift = offers.find((offer) => offer.status === "Accepted" && offer.shiftDate === today)
  const sheets = (await store.timesheets.all())
    .filter((sheet) => sheet.workerId === worker.id)
    .sort((a, b) => b.workDate.localeCompare(a.workDate))
  const latest = sheets[0]
  const expiring = check.tickets.filter((ticket) => ticket.validity === "expiring" || ticket.validity === "expired" || ticket.validity === "missing")

  return (
    <div className="space-y-4">
      <DemoBanner mock={isMock()} />
      <div className="flex items-start justify-between gap-3">
        <Heading kicker="Today" title={"G'day, " + worker.name.split(" ")[0]} />
        <StatusChip level={badgeLevel(check.badge)}>{check.label}</StatusChip>
      </div>
      <p className="text-sm text-navy/70">Pay is fortnightly, on Thursday.</p>
      {open ? (
        <section className="rounded-2xl border border-navy/10 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">Shift offer</p>
          <h2 className="mt-1 text-xl font-semibold">{open.roleName}</h2>
          <p className="mt-1 text-sm">
            {open.suburb} · {formatDate(open.shiftDate)} · {formatTime(open.startTime)}
          </p>
          <p className="text-sm text-navy/70">{open.rateToWorker}</p>
          <Link href={"/portal/offers/" + open.id} className="pill pill-teal mt-3 w-full">
            View offer
          </Link>
        </section>
      ) : null}
      {todayShift ? (
        <section className="rounded-2xl border border-navy/10 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">Today&apos;s shift</p>
          <h2 className="mt-1 text-xl font-semibold">{todayShift.siteName || todayShift.suburb}</h2>
          <p className="mt-1 text-sm">{todayShift.address || todayShift.suburb}</p>
          <p className="text-sm text-navy/70">Start {formatTime(todayShift.startTime)}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link href={"/portal/shifts/" + todayShift.id} className="pill pill-line-dark w-full px-3">
              Site info
            </Link>
            <Link href="/portal/timesheet" className="pill pill-teal w-full px-3">
              {afternoon ? "Log today's hours" : "Log hours"}
            </Link>
          </div>
        </section>
      ) : afternoon ? (
        <Link href="/portal/timesheet" className="pill pill-teal w-full">
          Log today&apos;s hours
        </Link>
      ) : null}
      <section className="rounded-2xl border border-navy/10 bg-white p-3">
        <h2 className="text-sm font-semibold">This fortnight</h2>
        <ul className="mt-2 space-y-1">
          {datesInFortnight(fortnight).map((day) => {
            const sheet = sheets.find((item) => item.workDate === day && item.status !== "Draft")
            const onShift = offers.some((offer) => offer.status === "Accepted" && offer.shiftDate === day)
            return (
              <li key={day} className="flex items-center justify-between text-sm">
                <span>{formatDate(day)}</span>
                <span className="font-semibold text-navy/70">
                  {sheet ? formatHours(sheet.totalHours) + " h · " + sheet.status : onShift ? "Not signed" : "—"}
                </span>
              </li>
            )
          })}
        </ul>
      </section>
      {latest?.status === "Approved" ? (
        <Link href={"/portal/timesheet/" + latest.id} className="block rounded-2xl border border-navy/10 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy/70">Signed hours</p>
          <p className="mt-1 font-semibold">
            {latest.totalHours} hours · {formatDate(latest.workDate)}
          </p>
        </Link>
      ) : null}
      {expiring.length ? (
        <section className="rounded-2xl border border-navy/10 bg-white p-4">
          <h2 className="text-sm font-semibold">Tickets to watch</h2>
          <ul className="mt-2 space-y-2">
            {expiring.slice(0, 3).map((ticket) => (
              <li key={ticket.type} className="flex items-center justify-between gap-2 text-sm">
                <span>{ticket.label}</span>
                <StatusChip level={ticket.validity === "expired" || ticket.validity === "missing" ? "do-not-book" : "warning"}>
                  {worker.tickets[ticket.type]?.status || "No"}
                </StatusChip>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {!worker.onboardingSubmitted && worker.status !== "Applicant" ? (
        <Link href="/portal/onboarding" className="pill pill-dark w-full">
          Finish onboarding
        </Link>
      ) : null}
      {worker.status === "Applicant" ? (
        <p className="text-sm leading-relaxed">MS Workforce will call you within 2 business days. You can log in any time.</p>
      ) : null}
    </div>
  )
}
