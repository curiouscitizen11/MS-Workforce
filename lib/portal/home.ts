import { datesInFortnight, fortnightContaining } from "@/lib/portal/pay"

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

export function greetingFor(minutes: number) {
  if (minutes < 12 * 60) return "Good morning"
  if (minutes < 17 * 60) return "Good afternoon"
  return "Good evening"
}

export function nextBookedShift<T extends { status: string; shiftDate: string; startTime: string }>(offers: T[], today: string) {
  const accepted = offers
    .filter((offer) => offer.status === "Accepted" && offer.shiftDate >= today)
    .sort((a, b) => a.shiftDate.localeCompare(b.shiftDate) || a.startTime.localeCompare(b.startTime))
  const todayShift = accepted.find((offer) => offer.shiftDate === today)
  if (todayShift) return { when: "today" as const, shift: todayShift }
  if (accepted[0]) return { when: "next" as const, shift: accepted[0] }
  return null
}

export function workerHomeRows(input: {
  offerCount: number
  hasShift: boolean
  timesheetUnsigned: boolean
  sheetStatus?: string
  ticketState: "expired" | "expiring" | "missing" | "ok"
  inductionTodos: number
  safetySaved: boolean
}) {
  let hours = "Up to date"
  let hoursAttention = false
  if (input.timesheetUnsigned) {
    hours = "Timesheet not signed"
    hoursAttention = true
  } else if (input.sheetStatus === "Approved") hours = "Approved"
  else if (input.sheetStatus === "Submitted" || input.sheetStatus === "Queried") hours = input.sheetStatus

  let shifts = "No shift booked"
  let shiftsAttention = false
  if (input.offerCount > 0) {
    shifts = input.offerCount === 1 ? "Offer waiting" : input.offerCount + " offers waiting"
    shiftsAttention = true
  } else if (input.hasShift) shifts = "Booked"

  let tickets = "Up to date"
  let ticketAttention = false
  if (input.ticketState === "expired") {
    tickets = "Expired"
    ticketAttention = true
  } else if (input.ticketState === "expiring") {
    tickets = "Ticket expiring"
    ticketAttention = true
  } else if (input.ticketState === "missing") {
    tickets = "Not added yet"
    ticketAttention = true
  }

  return [
    { href: "/portal/timesheet", label: "Log today's hours", status: hours, attention: hoursAttention },
    { href: "/portal/offers", label: "My shifts", status: shifts, attention: shiftsAttention },
    { href: "/portal/tickets", label: "Tickets & training", status: tickets, attention: ticketAttention },
    {
      href: "/portal/inductions",
      label: "Inductions",
      status: input.inductionTodos > 0 ? "Induction to do" : "Done",
      attention: input.inductionTodos > 0,
    },
    {
      href: "/portal/me#safety",
      label: "Safety info",
      status: input.safetySaved ? "Saved" : "Not added yet",
      attention: !input.safetySaved,
    },
  ]
}

export function portalHome(role: "worker" | "admin" | null) {
  if (role === "admin") return "/portal/admin"
  if (role === "worker") return "/portal"
  return "/portal/login"
}
