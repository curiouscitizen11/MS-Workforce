import { emailError, emailProblem } from "@/lib/portal/email"

export const BOOK_ROLES = ["General labourer", "Trade assistant", "Site clean", "Materials handling", "Other"] as const

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
  roles: string[]
  otherRole: string
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

function dateOk(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export function checkBookLabour(
  input: unknown,
  nowMs: number,
): { ok: true; value: BookValue } | { ok: true; ignored: true } | { ok: false; error: string } {
  const raw = input && typeof input === "object" ? (input as Record<string, unknown>) : {}
  const honeypot = typeof raw.companyWebsite === "string" ? raw.companyWebsite.trim() : ""
  if (honeypot) return { ok: true, ignored: true }
  const company = text(raw.company, 120)
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
  const roles = Array.isArray(raw.roles) ? raw.roles.filter((role): role is string => typeof role === "string" && (BOOK_ROLES as readonly string[]).includes(role)) : []
  if (roles.length === 0) return { ok: false, error: "Choose at least one role." }
  const otherRole = text(raw.otherRole, 200)
  if (roles.includes("Other") && otherRole.length < 2) return { ok: false, error: "Tell us a bit more about the other role." }
  const workers = Number(raw.workers)
  if (!Number.isInteger(workers) || workers < 1 || workers > 50) return { ok: false, error: "Enter how many workers, from 1 to 50." }
  const start = text(raw.start, 10)
  if (!dateOk(start)) return { ok: false, error: "Choose a start date." }
  const ongoing = raw.ongoing === true
  const end = ongoing ? "" : text(raw.end, 10)
  if (!ongoing && !dateOk(end)) return { ok: false, error: "Choose an end date, or tick ongoing." }
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
      otherRole: roles.includes("Other") ? otherRole : "",
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

export function placementProperties(value: BookValue): Record<string, unknown> {
  const details = [value.otherRole ? "Other role: " + value.otherRole : "", value.notes].filter(Boolean).join("\n")
  const properties: Record<string, unknown> = {
    Placement: value.company + " – " + value.suburb,
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
    "Roles: " + value.roles.join(", "),
    value.otherRole ? "Other role: " + value.otherRole : "",
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

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}
