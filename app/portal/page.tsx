import type { Metadata } from "next"
import Link from "next/link"
import { DemoBanner, Heading } from "@/components/portal/ui"
import { isMock } from "@/lib/portal/config"
import { complianceFor } from "@/lib/portal/services"
import { formatDate, formatTime, sydneyParts, sydneyToday } from "@/lib/portal/dates"
import { greetingFor, nextBookedShift, offersWaiting, shiftsMissingSupervisorSign, workerHomeRows } from "@/lib/portal/home"
import { inductionRows } from "@/lib/portal/inductions"
import { requireUser } from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"
import { sidesPresent, slotsFromWorker } from "@/lib/portal/ticket-photos"

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
  const check = complianceFor(worker, today)
  const offers = (await store.offers.all()).filter((offer) => offer.workerId === worker.id)
  const sheets = (await store.timesheets.all()).filter((sheet) => sheet.workerId === worker.id)
  const booked = nextBookedShift(offers, today)
  const todaySheet = sheets.find((sheet) => sheet.workDate === today && sheet.status !== "Draft")
  const missingSign = shiftsMissingSupervisorSign(offers, sheets, worker.id, today)
  const expiring = check.tickets.filter((ticket) => ticket.validity === "expiring" || ticket.validity === "expired" || ticket.validity === "missing")
  const docs = await store.documents.all()
  const photoMissing = slotsFromWorker(worker).some((slot) => {
    const sides = sidesPresent(docs, worker.id, slot.key)
    return !sides.front || !sides.back
  })
  const ticketState = expiring.some((ticket) => ticket.validity === "expired")
    ? "expired"
    : expiring.some((ticket) => ticket.validity === "expiring")
      ? "expiring"
      : expiring.some((ticket) => ticket.validity === "missing") || photoMissing || worker.tickets.whiteCard?.status !== "Yes, I have it"
        ? "missing"
        : "ok"
  const rows = workerHomeRows({
    offerCount: offersWaiting(offers, worker.id),
    hasShift: Boolean(booked),
    timesheetUnsigned: missingSign.length > 0 || Boolean(booked?.when === "today" && !todaySheet?.signaturePng),
    sheetStatus: todaySheet?.status,
    ticketState,
    inductionTodos: inductionRows({
      inductionPassed: worker.inductionPassed,
      siteInductions: worker.siteInductions,
      offers,
    }).filter((row) => !row.done).length,
    safetySaved: Boolean(worker.emergencyContact || worker.healthConsent || worker.allergies),
  })
  const shift = booked?.shift
  const place = shift ? shift.siteName || shift.suburb : ""

  return (
    <div>
      <DemoBanner mock={isMock()} />
      <div className="portal-home-greet">
        <p>{greetingFor(sydneyParts(now).minutes)}</p>
        <h1>{worker.name.split(" ")[0]}</h1>
      </div>
      <section className="portal-home-shift">
        <p>{booked?.when === "today" ? "Today's shift" : booked ? "Next shift" : "Shift"}</p>
        <p>{shift ? place + " · " + formatDate(shift.shiftDate) + " · " + formatTime(shift.startTime) : "No shift booked"}</p>
      </section>
      <div className="portal-list">
        {rows.map((row) => (
          <Link key={row.href} href={row.href} className="portal-list-row">
            <span className="portal-list-label">{row.label}</span>
            <span className={"portal-list-status" + (row.attention ? " portal-home-attention" : "")}>{row.status}</span>
            <span className="portal-list-chev" aria-hidden="true">
              ›
            </span>
          </Link>
        ))}
        {!worker.onboardingSubmitted && worker.status !== "Applicant" ? (
          <Link href="/portal/onboarding" className="portal-list-row">
            <span className="portal-list-label">Finish onboarding</span>
            <span className="portal-list-status portal-home-attention">To do</span>
            <span className="portal-list-chev" aria-hidden="true">
              ›
            </span>
          </Link>
        ) : null}
      </div>
      {worker.status === "Applicant" ? (
        <p className="px-[22px] pt-4 text-sm leading-relaxed">MS Workforce will call you within 2 business days. You can log in any time.</p>
      ) : null}
    </div>
  )
}
