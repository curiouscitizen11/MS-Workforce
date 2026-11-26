import { parseCalendarDate, sydneyToday } from "@/lib/portal/dates"
import { emailError, emailProblem } from "@/lib/portal/email"

export const HEARD_OPTIONS = [
  "Google",
  "Referral / word of mouth",
  "LinkedIn",
  "Facebook / Instagram",
  "Saw a worker or ute on site",
  "Other",
] as const

export const MIN_FILL_MS = 3000
export const BOOK_IP_MAX = 5
export const BOOK_IP_WINDOW_MS = 60 * 60 * 1000
export const BOOK_REPEAT_MS = 2 * 60 * 1000
export const COMPANY_MAX = 120
export const ROLES_MAX = 1000

export const PLACEMENT_PROPERTIES = [
  "Placement",
  "Client",
  "Site contact",
  "Site phone",
  "Site email",
  "Site address",
  "Site suburb",
  "Roles requested",
  "Labour request details",
  "Workers needed",
  "Start",
  "Open ended",
  "End",
  "Shift",
  "Heard about us",
  "Status",
  "Request source",
] as const

export type BookValue = {
  company: string
  name: string
  phone: string
  email: string
  address: string
  suburb: string
  roles: string
  workers: number
  start: string
  ongoing: boolean
  end: string
  shift: string
  notes: string
  heard: string
}

export function bookPhoneOk(input: string) {
  const trimmed = input.trim()
  if (trimmed.startsWith("+")) {
    const digits = trimmed.slice(1).replace(/\D/g, "")
    return digits.length >= 8 && digits.length <= 15
  }
  const digits = trimmed.replace(/\D/g, "")
  if (digits.length !== 10) return false
  return digits.startsWith("04") || /^0[2378]/.test(digits)
}

function calendarDate(value: string) {
  return parseCalendarDate(value)
}

export function checkBookLabour(
  input: unknown,
  nowMs: number,
): { ok: true; value: BookValue } | { ok: true; ignored: true } | { ok: false; error: string } {
  const raw = input && typeof input === "object" ? (input as Record<string, unknown>) : {}
  const honeypot = typeof raw.companyWebsite === "string" ? raw.companyWebsite.trim() : ""
  if (honeypot) return { ok: true, ignored: true }
  if (trimmed(raw.company).length > COMPANY_MAX) {
    return { ok: false, error: "The company name is too long. Keep it under 120 characters." }
  }
  const company = text(raw.company, COMPANY_MAX)
  if (company.length < 2) return { ok: false, error: "Enter the company name." }
  const name = text(raw.name, 80)
  if (name.length < 2) return { ok: false, error: "Enter your name." }
  const phone = text(raw.phone, 40)
  if (!bookPhoneOk(phone)) return { ok: false, error: "Enter an Australian phone number, or an international number starting with +." }
  const email = text(raw.email, 120)
  const emailIssue = emailError(emailProblem(email, email, true))
  if (emailIssue) return { ok: false, error: emailIssue }
  const address = text(raw.address, 200)
  if (address.length < 5) return { ok: false, error: "Enter the site address." }
  const suburb = text(raw.suburb, 80)
  if (suburb.length < 2) return { ok: false, error: "Enter the suburb." }
  if (trimmed(raw.roles).length > ROLES_MAX) {
    return { ok: false, error: "That roles note is too long. Keep it under 1,000 characters." }
  }
  const roles = text(raw.roles, ROLES_MAX)
  if (roles.length < 2) return { ok: false, error: "Tell us what roles you need." }
  const workers = Number(raw.workers)
  if (!Number.isInteger(workers) || workers < 1 || workers > 50) return { ok: false, error: "Enter how many workers, from 1 to 50." }
  const start = calendarDate(text(raw.start, 32)) || ""
  if (!start) return { ok: false, error: "Choose a start date." }
  if (start < sydneyToday(new Date(nowMs))) return { ok: false, error: "Choose a start date that is today or later." }
  const ongoing = raw.ongoing === true
  const end = ongoing ? "" : calendarDate(text(raw.end, 32)) || ""
  if (!ongoing && !end) return { ok: false, error: "Choose an end date, or tick ongoing." }
  if (!ongoing && end < start) return { ok: false, error: "The end date must be on or after the start date." }
  const shift = text(raw.shift, 200)
  if (shift.length < 2) return { ok: false, error: "Enter the shift and start time." }
  const notes = text(raw.notes, 2000)
  const heard = text(raw.heard, 80)
  if (heard && !(HEARD_OPTIONS as readonly string[]).includes(heard)) return { ok: false, error: "Choose how you heard about us, or leave it blank." }
  const startedAt = typeof raw.startedAt === "number" ? raw.startedAt : 0
  if (nowMs - startedAt < MIN_FILL_MS) return { ok: false, error: "Please wait a moment and send again." }
  return {
    ok: true,
    value: {
      company,
      name,
      phone,
      email,
      address,
      suburb,
      roles,
      workers,
      start,
      ongoing,
      end,
      shift,
      notes,
      heard,
    },
  }
}

/** One title per submission. A retry of that same request matches this text in Notion. */
export function placementRequestTitle(company: string, suburb: string, requestId: string) {
  return company + " – " + suburb + " – " + requestId
}

export function placementProperties(value: BookValue, requestId?: string): Record<string, unknown> {
  const details = value.notes
  const properties: Record<string, unknown> = {
    Placement: requestId ? placementRequestTitle(value.company, value.suburb, requestId) : value.company + " – " + value.suburb,
    Client: value.company,
    "Site contact": value.name,
    "Site phone": value.phone,
    "Site email": value.email,
    "Site address": value.address,
    "Site suburb": value.suburb,
    "Roles requested": value.roles,
    "Workers needed": value.workers,
    Start: value.start,
    "Open ended": value.ongoing,
    Shift: value.shift,
    Status: "Enquiry",
    "Request source": "Website form",
  }
  if (details) properties["Labour request details"] = details
  if (!value.ongoing && value.end) properties.End = value.end
  if (value.heard) properties["Heard about us"] = value.heard
  return properties
}

export function bookAlertBody(value: BookValue) {
  return [
    "Company: " + value.company,
    "Name: " + value.name,
    "Phone: " + value.phone,
    "Email: " + value.email,
    "Site: " + value.address + ", " + value.suburb,
    "Roles: " + value.roles,
    "Workers: " + value.workers,
    "Start: " + value.start,
    "Ongoing: " + (value.ongoing ? "Yes" : "No"),
    value.end ? "End: " + value.end : "",
    "Shift: " + value.shift,
    value.notes ? "Notes: " + value.notes : "",
    value.heard ? "Heard about us: " + value.heard : "",
  ]
    .filter(Boolean)
    .join("\n")
}

export function sameBookedRequest(properties: Record<string, unknown>, value: BookValue) {
  return (
    properties.Client === value.company &&
    properties["Site email"] === value.email &&
    properties["Site suburb"] === value.suburb &&
    properties["Roles requested"] === value.roles &&
    properties["Workers needed"] === value.workers &&
    properties.Start === value.start &&
    properties["Open ended"] === value.ongoing &&
    (properties.End || "") === (value.end || "") &&
    properties.Shift === value.shift &&
    (properties["Labour request details"] || "") === (value.notes || "")
  )
}

function trimmed(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function text(value: unknown, max: number) {
  return trimmed(value).slice(0, max)
}
