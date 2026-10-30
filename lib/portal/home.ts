import { formatHours } from "@/lib/portal/hours"
import { datesInFortnight, fortnightContaining } from "@/lib/portal/pay"

type SummaryOffer = { workerId: string; status: string; shiftDate: string }
type SummarySheet = { workerId: string; workDate: string; status: string; totalHours?: number; signaturePng?: string }

export function fortnightSummary(offers: SummaryOffer[], sheets: SummarySheet[], workerId: string, today: string) {
  const days = new Set(datesInFortnight(fortnightContaining(today)))
  const shifts = offers.filter(
    (offer) => offer.workerId === workerId && days.has(offer.shiftDate) && (offer.status === "Accepted" || offer.status === "Offered"),
  )
  const hours = sheets.filter((sheet) => sheet.workerId === workerId && days.has(sheet.workDate))
  const approvedHours = hours.filter((sheet) => sheet.status === "Approved").reduce((sum, sheet) => sum + (sheet.totalHours || 0), 0)
  const unsigned = unsignedFortnightDays(offers, sheets, workerId, today)
  const empty = shifts.length === 0 && hours.length === 0
  const text = empty
    ? "This fortnight: nothing yet"
    : "This fortnight: " + formatHours(approvedHours) + " h approved · " + (unsigned === 0 ? "all signed" : unsigned + " not signed")
  return { text, approvedHours, unsigned, empty }
}

export function offersWaiting(offers: { workerId: string; status: string }[], workerId: string) {
  return offers.filter((offer) => offer.workerId === workerId && offer.status === "Offered").length
}

export function unsignedFortnightDays(
  offers: { workerId: string; status: string; shiftDate: string }[],
  sheets: { workerId: string; workDate: string; status: string; signaturePng?: string }[],
  workerId: string,
  today: string,
) {
  return datesInFortnight(fortnightContaining(today)).filter((day) => {
    if (day > today) return false
    const worked = offers.some((offer) => offer.workerId === workerId && offer.status === "Accepted" && offer.shiftDate === day)
    if (!worked) return false
    return !sheets.some(
      (sheet) =>
        sheet.workerId === workerId &&
        sheet.workDate === day &&
        (sheet.status === "Approved" || Boolean(sheet.signaturePng)),
    )
  }).length
}

export function shiftsMissingSupervisorSign<T extends { id: string; workerId: string; status: string; shiftDate: string }>(
  offers: T[],
  sheets: { workerId: string; offerId?: string; workDate: string; signaturePng?: string }[],
  workerId: string,
  today: string,
) {
  return offers.filter((offer) => {
    if (offer.workerId !== workerId || offer.status !== "Accepted" || offer.shiftDate >= today) return false
    const signed = sheets.some(
      (sheet) =>
        sheet.workerId === workerId &&
        (sheet.offerId === offer.id || (!sheet.offerId && sheet.workDate === offer.shiftDate)) &&
        Boolean(sheet.signaturePng),
    )
    return !signed
  })
}

export function inductionTodoCount(
  inductionPassed: boolean,
  offers: { workerId: string; status: string; shiftDate: string; inductionLink?: string }[],
  workerId: string,
  today: string,
) {
  const sites = offers.filter(
    (offer) => offer.workerId === workerId && offer.status === "Accepted" && offer.shiftDate >= today && Boolean(offer.inductionLink),
  )
  return (inductionPassed ? 0 : 1) + sites.length
}

export function ticketActionCount(labels: string[]) {
  return new Set(labels.filter(Boolean)).size
}

export function cardsAwaitingCheck(
  workers: {
    tickets: Record<string, { status?: string; checkedAt?: string }>
    otherTicketsHeld?: string[]
    licenceChecks?: Record<string, { checkedAt?: string }>
  }[],
) {
  let count = 0
  for (const worker of workers) {
    for (const ticket of Object.values(worker.tickets)) {
      if (ticket.status === "Yes, I have it" && !ticket.checkedAt) count += 1
    }
    for (const label of worker.otherTicketsHeld || []) {
      if (label === "None of these") continue
      if (!worker.licenceChecks?.[label]?.checkedAt) count += 1
    }
  }
  return count
}

export function photosAwaitingApproval(docs: { kind: string; headshotStatus?: string; deletedAt?: string }[]) {
  return docs.filter((doc) => doc.kind === "headshot" && doc.headshotStatus === "Pending" && !doc.deletedAt).length
}

export function portalHome(role: "worker" | "admin" | null) {
  if (role === "admin") return "/portal/admin"
  if (role === "worker") return "/portal"
  return "/portal/login"
}
