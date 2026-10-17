import { daysBetween } from "@/lib/portal/dates"
import { TICKET_LABELS, TICKET_TYPES, type TicketType } from "@/lib/portal/types"

export type Badge = "ok" | "warning" | "restricted" | "do-not-book"

export const BADGE_LABELS: Record<Badge, string> = {
  ok: "OK",
  warning: "Expiring soon",
  restricted: "Restricted – check before booking",
  "do-not-book": "DO NOT BOOK",
}

export type TicketInput = {
  type: TicketType
  status?: string
  expiry?: string | null
}

export type TicketValidity = "valid" | "expiring" | "expired" | "missing" | "not-held"

export type TicketAssessment = {
  type: TicketType
  label: string
  validity: TicketValidity
  daysUntilExpiry: number | null
  message: string
}

export type Assessment = {
  badge: Badge
  label: string
  reasons: string[]
  tickets: TicketAssessment[]
}

const RANK: Record<Badge, number> = {
  ok: 0,
  warning: 1,
  restricted: 2,
  "do-not-book": 3,
}

export function warningWindowDays(type: TicketType): number {
  if (type === "asbestosA" || type === "asbestosB" || type === "firstAid") return 60
  return 30
}

export function isMarkedExpired(status: string | undefined): boolean {
  return (status || "").trim() === "Expired"
}

export function isHeld(type: TicketType, status: string | undefined): boolean {
  const value = (status || "").trim()
  if (!value || value === "Not held" || value === "Expired") return false
  if (type === "driverLicence") return true
  return value === "Held"
}

export function asTicketInputs(
  tickets: Partial<Record<TicketType, { status?: string; expiry?: string | null }>>,
): TicketInput[] {
  return TICKET_TYPES.map((type) => ({
    type,
    status: tickets[type]?.status || "",
    expiry: tickets[type]?.expiry || null,
  }))
}

export function assessTicket(ticket: TicketInput, checkDate: string): TicketAssessment {
  const label = TICKET_LABELS[ticket.type]
  const windowDays = warningWindowDays(ticket.type)
  const days =
    ticket.expiry && /^\d{4}-\d{2}-\d{2}$/.test(ticket.expiry)
      ? daysBetween(checkDate, ticket.expiry)
      : null
  const past = days !== null && days < 0
  const held = isHeld(ticket.type, ticket.status)
  const marked = isMarkedExpired(ticket.status)

  if (ticket.type === "whiteCard") {
    if (marked || (held && past)) {
      return { type: ticket.type, label, validity: "expired", daysUntilExpiry: days, message: "White card is expired" }
    }
    if (!held) {
      return { type: ticket.type, label, validity: "missing", daysUntilExpiry: null, message: "White card is missing" }
    }
  } else if (marked || (held && past)) {
    return { type: ticket.type, label, validity: "expired", daysUntilExpiry: days, message: label + " is expired" }
  } else if (!held) {
    return { type: ticket.type, label, validity: "not-held", daysUntilExpiry: null, message: label + " is not held" }
  }

  if (days !== null && days <= windowDays) {
    return {
      type: ticket.type,
      label,
      validity: "expiring",
      daysUntilExpiry: days,
      message: label + " expires in " + days + " days",
    }
  }
  return {
    type: ticket.type,
    label,
    validity: "valid",
    daysUntilExpiry: days,
    message: label + " is valid",
  }
}

export function assessTickets(tickets: TicketInput[], checkDate: string): Assessment {
  const rows = TICKET_TYPES.map((type) => {
    return assessTicket(tickets.find((ticket) => ticket.type === type) || { type, status: "" }, checkDate)
  })
  let badge: Badge = "ok"
  const reasons: string[] = []
  for (const row of rows) {
    let next: Badge | null = null
    if (row.type === "whiteCard" && (row.validity === "missing" || row.validity === "expired")) next = "do-not-book"
    else if ((row.type === "asbestosA" || row.type === "asbestosB") && row.validity === "expired") next = "do-not-book"
    else if (row.validity === "expired") next = "restricted"
    else if (row.validity === "expiring") next = "warning"
    if (next) {
      if (RANK[next] > RANK[badge]) badge = next
      reasons.push(row.message)
    }
  }
  return { badge, label: BADGE_LABELS[badge], reasons, tickets: rows }
}

export function ticketValidOn(ticket: TicketInput, date: string): boolean {
  const row = assessTicket(ticket, date)
  return row.validity === "valid" || row.validity === "expiring"
}

export function canAcceptShift(input: {
  tickets: TicketInput[]
  jobDate: string
  required: TicketType[]
}):
  | { ok: true; badge: Badge; label: string }
  | { ok: false; code: "do-not-book" | "ticket"; message: string } {
  const assessment = assessTickets(input.tickets, input.jobDate)
  if (assessment.badge === "do-not-book") {
    return {
      ok: false,
      code: "do-not-book",
      message: "Call Mav. DO NOT BOOK. " + assessment.reasons.join(". ") + ".",
    }
  }
  const required = Array.from(new Set<TicketType>(["whiteCard", ...input.required]))
  for (const type of required) {
    const ticket = input.tickets.find((item) => item.type === type) || { type, status: "" }
    if (!ticketValidOn(ticket, input.jobDate)) {
      return {
        ok: false,
        code: "ticket",
        message: "Call Mav. " + TICKET_LABELS[type] + " is not valid on the job date.",
      }
    }
  }
  return { ok: true, badge: assessment.badge, label: assessment.label }
}

export function earliestExpiry(tickets: TicketInput[], visaExpiry?: string | null): string | null {
  const dates: string[] = []
  for (const ticket of tickets) {
    if (isHeld(ticket.type, ticket.status) && ticket.expiry) dates.push(ticket.expiry)
  }
  if (visaExpiry) dates.push(visaExpiry)
  dates.sort()
  return dates[0] || null
}

export type ReminderStage = "window" | "14" | "7" | "0"

/** One reminder when the window opens, then at 14 days, 7 days and on the expiry day. */
export function dueReminderStage(daysUntil: number, windowDays: number, sent: string[]): ReminderStage | null {
  if (daysUntil < 0 || daysUntil > windowDays) return null
  const due: ReminderStage[] = ["window"]
  if (daysUntil <= 14) due.push("14")
  if (daysUntil <= 7) due.push("7")
  if (daysUntil <= 0) due.push("0")
  const pending = due.filter((stage) => !sent.includes(stage))
  return pending.length ? pending[pending.length - 1] : null
}

export function visaState(expiry: string | null | undefined, checkDate: string): "none" | "ok" | "expiring" | "expired" {
  if (!expiry) return "none"
  const days = daysBetween(checkDate, expiry)
  if (days < 0) return "expired"
  if (days <= 30) return "expiring"
  return "ok"
}
