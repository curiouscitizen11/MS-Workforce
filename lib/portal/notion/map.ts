import { asTicketInputs, earliestExpiry } from "@/lib/portal/compliance"
import { parseCalendarDate } from "@/lib/portal/dates"
import { workDoneText } from "@/lib/portal/work-done"
import { notionOtherTickets } from "@/lib/portal/ticket-catalogue"
import { heldLicenceExpiries } from "@/lib/portal/ticket-photos"
import { sensitiveFindings } from "@/lib/portal/privacy"
import {
  LIVE_ALLERGIES,
  LIVE_ALLERGY_TYPES,
  LIVE_ANAPHYLAXIS,
  LIVE_APPROVER_ROLES,
  LIVE_CONDITIONS,
  LIVE_CONSTRUCTION,
  LIVE_EPIPEN,
  LIVE_EXPERIENCE,
  LIVE_FITNESS,
  LIVE_ID_METHODS,
  LIVE_INJURY,
  LIVE_LICENCE_STATES,
  LIVE_MEDICATION,
  LIVE_OTHER_TICKETS,
  LIVE_RELATIONSHIPS,
  LIVE_ROLES,
  LIVE_RTW,
  LIVE_SHARING,
  LIVE_TASKS,
  LIVE_TICKET_OPTIONS,
  LIVE_TRANSPORT,
  LIVE_VERIFICATION,
  LIVE_VEVO_METHODS,
  LIVE_VEVO_RESULTS,
  LIVE_WORK_AREAS,
  notionMulti,
  notionSelect,
  notionWorkDays,
  toLiveOption,
} from "@/lib/portal/notion/live-options"
import {
  OFFER_STATUSES,
  TICKET_LABELS,
  WORKER_STATUSES,
  type Offer,
  type TicketType,
  type Timesheet,
  type Worker,
} from "@/lib/portal/types"

const BANNED = ["passport", "tfn", "tax file", "bsb", "bank", "super", "password"]

const FREE_TEXT = new Set([
  "Experience summary",
  "Notes",
  "Other tickets",
  "Address",
  "Emergency contact",
  "Decline reason",
  "Incident note",
  "Query note",
  "Tasks",
  "Medical notes",
  "Work history",
  "Site inductions",
])

export class NotionPayloadError extends Error {}

function keyIsPrivate(key: string) {
  const lower = key.toLowerCase()
  return BANNED.some((word) => {
    // "Supervisor" is a person on site. "Super" on its own is still a superannuation field.
    if (word === "super") return /\bsuper\b/.test(lower) || lower.includes("superannuation")
    return lower.includes(word)
  })
}

export function assertNotionPayloadSafe(properties: Record<string, unknown>) {
  for (const key of Object.keys(properties)) {
    if (keyIsPrivate(key)) {
      throw new NotionPayloadError("Refusing to write a private field to Notion: " + key)
    }
    const value = properties[key]
    if (typeof value === "string" && FREE_TEXT.has(key) && sensitiveFindings(value).length) {
      throw new NotionPayloadError("Refusing to write tax, bank or super details to Notion.")
    }
  }
}

function put(target: Record<string, unknown>, key: string, value: unknown) {
  if (value === undefined || value === null || value === "") return
  target[key] = value
}

function choice(value: string | undefined, allowed: readonly string[]): string | undefined {
  if (!value) return undefined
  if (!allowed.includes(value)) {
    throw new NotionPayloadError("'" + value + "' is not an existing Notion option.")
  }
  return value
}

function siteInductionsLine(worker: Worker): string | undefined {
  const line = (worker.siteInductions || [])
    .map((item) => {
      const name = item.name.trim()
      if (!name) return ""
      return item.doneOn ? name + " (" + item.doneOn + ")" : name
    })
    .filter(Boolean)
    .join("; ")
  return line || undefined
}

function nextTicketExpiry(worker: Worker): string | undefined {
  const dates: string[] = []
  const soonest = earliestExpiry(asTicketInputs(worker.tickets), null)
  if (soonest) dates.push(soonest)
  for (const extra of heldLicenceExpiries(worker)) {
    if (extra.expiry) dates.push(extra.expiry)
  }
  dates.sort()
  return dates[0]
}

function ticketChoice(status: string | undefined, notes: string[]) {
  const picked = notionSelect(status, LIVE_TICKET_OPTIONS, "Ticket")
  if (picked.note) notes.push(picked.note)
  return picked.value
}

function rtwChoice(value: string | undefined, notes: string[]) {
  const mapped = value === "Citizen - passport" ? "Australian citizen" : value === "Visa - VEVO" ? "Visa holder" : value
  const picked = notionSelect(mapped, LIVE_RTW, "RTW evidence")
  if (picked.note) notes.push(picked.note)
  return picked.value
}

function fitnessChoice(value: string | undefined, notes: string[]) {
  const mapped = value === "Yes" ? "Yes, I can safely do these tasks" : value
  const picked = notionSelect(mapped, LIVE_FITNESS, "Fitness declaration")
  if (picked.note) notes.push(picked.note)
  return picked.value
}

function one(value: string | undefined, allowed: readonly string[], field: string, notes: string[]) {
  const picked = notionSelect(value, allowed, field)
  if (picked.note) notes.push(picked.note)
  return picked.value
}

function many(values: string[] | undefined, allowed: readonly string[], field: string, notes: string[]) {
  const picked = notionMulti(values, allowed, field)
  if (picked.note) notes.push(picked.note)
  return picked.values
}

export function workerNotionProperties(worker: Worker): Record<string, unknown> {
  const props: Record<string, unknown> = {}
  const notes: string[] = []
  put(props, "Name", worker.name)
  put(props, "Mobile", worker.mobile)
  put(props, "Email", worker.email)
  put(props, "Suburb", worker.suburb)
  const roles = many(worker.roles, LIVE_ROLES, "Roles of interest", notes)
  if (roles) props["Roles of interest"] = roles
  put(props, "Experience summary", worker.experience)
  props["WhatsApp OK"] = worker.whatsappOk
  put(props, "Status", choice(worker.status, WORKER_STATUSES))
  props["Privacy consent"] = worker.privacyConsent
  put(props, "Date of birth", worker.dob)
  put(props, "Address", worker.address)
  put(props, "Emergency contact", worker.emergencyContact)
  put(props, "Emergency phone", worker.emergencyPhone)
  put(props, "Preferred name", worker.preferredName)
  put(props, "Postcode", worker.postcode)
  put(props, "Emergency relationship", one(worker.emergencyRelationship, LIVE_RELATIONSHIPS, "Emergency relationship", notes))
  put(props, "Experience level", one(worker.experienceLevel, LIVE_EXPERIENCE, "Experience level", notes))
  put(props, "Work history", worker.workHistory)
  put(props, "Available from", worker.availableFrom)
  const areas = many(worker.workAreas, LIVE_WORK_AREAS, "Work areas", notes)
  if (areas) props["Work areas"] = areas
  const days = notionWorkDays(worker.workDays)
  if (days.note) notes.push(days.note)
  if (days.values) props["Work days"] = days.values
  put(props, "RTW evidence", rtwChoice(worker.rtw, notes))
  put(props, "Right to work", one(worker.rightToWork, ["Yes", "No", "Pending"], "Right to work", notes))
  props["VEVO consent"] = Boolean(worker.vevoConsent)
  put(props, "Visa subclass", worker.visaSubclass)
  put(props, "Visa expiry", worker.visaExpiry)
  put(props, "VEVO method", one(worker.vevoMethod, LIVE_VEVO_METHODS, "VEVO method", notes))
  put(props, "VEVO result", one(worker.vevoResult, LIVE_VEVO_RESULTS, "VEVO result", notes))
  put(props, "VEVO checked on", worker.vevoCheckedOn)
  put(props, "White card", ticketChoice(worker.tickets.whiteCard.status, notes))
  put(props, "Work at heights", ticketChoice(worker.tickets.heights.status, notes))
  put(props, "Asbestos class A", ticketChoice(worker.tickets.asbestosA.status, notes))
  put(props, "Asbestos class B", ticketChoice(worker.tickets.asbestosB.status, notes))
  put(props, "Confined space", ticketChoice(worker.tickets.confinedSpace.status, notes))
  put(props, "Driver licence", ticketChoice(worker.tickets.driverLicence.status, notes))
  put(props, "First aid", ticketChoice(worker.tickets.firstAid.status, notes))
  const extraTickets = notionOtherTickets(worker.otherTicketsHeld)
  const otherStatus = worker.tickets.other.status === "No" ? undefined : toLiveOption(worker.tickets.other.status, "Other tickets")
  const otherText = [worker.tickets.other.note, extraTickets.custom.join("; ")].filter(Boolean).join(". ")
  put(props, "Other tickets", otherText || otherStatus)
  put(props, "White card expiry", worker.tickets.whiteCard.expiry)
  put(props, "Work at heights expiry", worker.tickets.heights.expiry)
  put(props, "Asbestos class A expiry", worker.tickets.asbestosA.expiry)
  put(props, "Asbestos class B expiry", worker.tickets.asbestosB.expiry)
  put(props, "Confined space expiry", worker.tickets.confinedSpace.expiry)
  put(props, "Driver licence expiry", worker.tickets.driverLicence.expiry)
  put(props, "First aid expiry", worker.tickets.firstAid.expiry)
  put(props, "White card issued", worker.tickets.whiteCard.issued)
  put(props, "Work at heights issued", worker.tickets.heights.issued)
  put(props, "Asbestos class A issued", worker.tickets.asbestosA.issued)
  put(props, "Asbestos class B issued", worker.tickets.asbestosB.issued)
  put(props, "Confined space issued", worker.tickets.confinedSpace.issued)
  put(props, "Driver licence issued", worker.tickets.driverLicence.issued)
  put(props, "First aid issued", worker.tickets.firstAid.issued)
  put(props, "Driver card number", worker.tickets.driverLicence.cardNumber)
  put(props, "Next ticket expiry", nextTicketExpiry(worker))
  const held = many(extraTickets.known, LIVE_OTHER_TICKETS, "Other tickets held", notes)
  if (held) props["Other tickets held"] = held
  put(props, "Transport", one(worker.transport, LIVE_TRANSPORT, "Transport", notes))
  put(props, "Fitness declaration", fitnessChoice(worker.fitness, notes))
  put(props, "Construction work in last 2 years", one(worker.constructionRecent, LIVE_CONSTRUCTION, "Construction work in last 2 years", notes))
  put(props, "Driver licence state", one(worker.licenceState, LIVE_LICENCE_STATES, "Driver licence state", notes))
  if (typeof worker.daConsent === "boolean") props["D&A consent"] = worker.daConsent
  if (typeof worker.declaration === "boolean") props.Declaration = worker.declaration
  if (typeof worker.idSighted === "boolean") props["ID sighted"] = worker.idSighted
  put(props, "ID sighted method", one(worker.idSightedMethod, LIVE_ID_METHODS, "ID sighted method", notes))
  put(props, "ID sighted on", worker.idSightedOn)
  put(props, "Allergies", one(worker.allergies, LIVE_ALLERGIES, "Allergies", notes))
  const allergyTypes = many(worker.allergyTypes, LIVE_ALLERGY_TYPES, "Allergy types", notes)
  if (allergyTypes) props["Allergy types"] = allergyTypes
  put(props, "Anaphylaxis risk", one(worker.anaphylaxis, LIVE_ANAPHYLAXIS, "Anaphylaxis risk", notes))
  put(props, "Carries EpiPen", one(worker.epipen, LIVE_EPIPEN, "Carries EpiPen", notes))
  const conditions = many(worker.medicalConditions, LIVE_CONDITIONS, "Medical conditions", notes)
  if (conditions) props["Medical conditions"] = conditions
  put(props, "Medical notes", worker.medicalNotes)
  put(props, "Injury affecting duties", one(worker.injury, LIVE_INJURY, "Injury affecting duties", notes))
  const tasksAffected = many(worker.tasksAffected, LIVE_TASKS, "Tasks affected", notes)
  if (tasksAffected) props["Tasks affected"] = tasksAffected
  put(props, "Safety medication", one(worker.safetyMedication, LIVE_MEDICATION, "Safety medication", notes))
  put(props, "Medical sharing", one(worker.medicalSharing, LIVE_SHARING, "Medical sharing", notes))
  props["Health info consent"] = Boolean(worker.healthConsent)
  props["Policies acknowledged"] = Boolean(worker.policiesAck)
  props["Contract accepted in form"] = Boolean(worker.contractAccepted)
  put(props, "Onboarding submitted", worker.onboardingSubmitted)
  put(props, "Terms signed", worker.termsSignedOn)
  put(props, "Form status", worker.formStatus)
  put(props, "Induction passed", worker.inductionPassed)
  put(props, "Site inductions", siteInductionsLine(worker))
  if (typeof worker.inductionScore === "number") props["Induction score"] = worker.inductionScore
  put(props, "Induction version", worker.inductionVersion)
  props["Tickets verified"] = Boolean(worker.ticketsVerified)
  put(props, "Verified on", worker.verifiedOn)
  put(props, "Verified by", worker.verifiedBy)
  put(props, "Verification method", one(worker.verificationMethod, LIVE_VERIFICATION, "Verification method", notes))
  put(props, "Images deleted on", worker.imagesDeletedOn)
  put(props, "Notes", [worker.notes, ...notes].filter(Boolean).join("\n") || undefined)
  assertNotionPayloadSafe(props)
  return props
}

export function offerNotionProperties(offer: Offer, workerName: string): Record<string, unknown> {
  const props: Record<string, unknown> = {
    Offer: offer.placementRef + " – " + workerName + " – " + offer.shiftDate,
    Status: choice(offer.status, OFFER_STATUSES),
  }
  put(props, "Start time", offer.startTime)
  put(props, "Role", offer.roleName)
  put(props, "Rate to worker", offer.rateToWorker)
  put(props, "Shift dates", offer.shiftDate)
  put(props, "Offer expires", offer.expiresAt)
  put(props, "Sent at", offer.sentAt)
  put(props, "Responded at", offer.respondedAt)
  put(props, "Decline reason", offer.declineReason)
  put(props, "Created by", "Portal")
  put(props, "Suburb", offer.suburb)
  put(props, "Address", offer.address)
  put(props, "Site name", offer.siteName)
  put(props, "Site contact", offer.siteContact)
  put(props, "Site phone", offer.sitePhone)
  props["Expected hours"] = offer.expectedHours
  put(props, "Bring", offer.bring)
  props["Required tickets"] = offer.requiredTickets.map((type: TicketType) => TICKET_LABELS[type])
  assertNotionPayloadSafe(props)
  return props
}

export function timesheetNotionProperties(sheet: Timesheet): Record<string, unknown> {
  if (sheet.status === "Draft") throw new NotionPayloadError("Draft timesheets are not sent to Notion.")
  const props: Record<string, unknown> = {
    Entry: sheet.workerName + " – " + sheet.workDate,
    Status: choice(sheet.status, ["Submitted", "Approved", "Queried"]),
    Source: "Portal",
  }
  put(props, "Worker name", sheet.workerName)
  put(props, "Placement ID", sheet.placementRef)
  put(props, "Work date", sheet.workDate)
  put(props, "Start (form)", sheet.start)
  put(props, "Finish (form)", sheet.finish)
  put(props, "Break (form)", String(sheet.breakMinutes))
  put(props, "Break start", sheet.breakStart)
  put(props, "Hours (form)", String(sheet.totalHours))
  props["Total hours"] = sheet.totalHours
  put(props, "Tasks", workDoneText(sheet.tasks, sheet.taskNote))
  props["Incident reported"] = sheet.incident
  put(props, "Incident note", sheet.incidentNote)
  put(props, "Query note", sheet.workerNote)
  put(props, "Worker confirmed", sheet.workerConfirmedAt)
  put(props, "Approved by", sheet.supervisorName)
  put(props, "Supervisor name", sheet.supervisorName)
  put(props, "Supervisor email", sheet.supervisorEmail)
  put(props, "Approver role", notionSelect(sheet.supervisorRole, LIVE_APPROVER_ROLES, "Approver role").value)
  put(props, "Approved at", sheet.approvedAt)
  put(props, "Pay fortnight", sheet.payFortnight)
  props["Signer mismatch"] = Boolean(sheet.signerMismatch)
  props["Corrected by MS Workforce"] = Boolean(sheet.corrected)
  assertNotionPayloadSafe(props)
  return props
}

type FieldType = "title" | "text" | "phone" | "email" | "select" | "multi" | "date" | "checkbox" | "number"

const TITLE_FIELDS = new Set(["Name", "Offer", "Entry", "Placement"])
const PHONE_FIELDS = new Set(["Mobile", "Emergency phone", "Site phone"])
const EMAIL_FIELDS = new Set(["Email", "Supervisor email", "Site email"])
const SELECT_FIELDS = new Set([
  "Status",
  "RTW evidence",
  "Right to work",
  "VEVO result",
  "White card",
  "White card state",
  "Work at heights",
  "Asbestos class A",
  "Asbestos class B",
  "Confined space",
  "Driver licence",
  "First aid",
  "Transport",
  "Fitness declaration",
  "Verification method",
  "Role",
  "Source",
  "Experience level",
  "VEVO method",
  "Heard about us",
  "Emergency relationship",
  "Construction work in last 2 years",
  "Driver licence state",
  "ID sighted method",
  "Allergies",
  "Anaphylaxis risk",
  "Carries EpiPen",
  "Injury affecting duties",
  "Safety medication",
  "Medical sharing",
  "Approver role",
])
const DATE_FIELDS = new Set([
  "Date of birth",
  "VEVO checked on",
  "White card expiry",
  "White card issued",
  "Work at heights expiry",
  "Work at heights issued",
  "Asbestos class A expiry",
  "Asbestos class A issued",
  "Asbestos class B expiry",
  "Asbestos class B issued",
  "Confined space expiry",
  "Confined space issued",
  "Driver licence expiry",
  "Driver licence issued",
  "First aid expiry",
  "First aid issued",
  "Next ticket expiry",
  "Onboarding submitted",
  "Terms signed",
  "Induction passed",
  "Verified on",
  "Images deleted on",
  "Shift dates",
  "Offer expires",
  "Sent at",
  "Responded at",
  "Work date",
  "Approved at",
  "Worker confirmed",
  "Visa expiry",
  "Available from",
  "ID sighted on",
  "Start",
  "End",
])
const NUMBER_FIELDS = new Set(["Induction score", "Expected hours", "Total hours", "Workers needed"])

export function toNotionProperties(flat: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(flat)) {
    if (value === undefined || value === null || value === "") continue
    let typed: unknown
    if (TITLE_FIELDS.has(key)) typed = toNotionApiValue("title", value)
    else if (PHONE_FIELDS.has(key)) typed = toNotionApiValue("phone", value)
    else if (EMAIL_FIELDS.has(key)) typed = toNotionApiValue("email", value)
    else if (SELECT_FIELDS.has(key)) typed = toNotionApiValue("select", typeof value === "string" ? toLiveOption(value, key) : value)
    else if (DATE_FIELDS.has(key)) typed = toNotionApiValue("date", value)
    else if (NUMBER_FIELDS.has(key) || typeof value === "number") typed = toNotionApiValue("number", value)
    else if (typeof value === "boolean") typed = toNotionApiValue("checkbox", value)
    else if (Array.isArray(value)) typed = toNotionApiValue("multi", value.map((item) => (typeof item === "string" ? toLiveOption(item, key) : item)))
    else typed = toNotionApiValue("text", value)
    if (typed !== undefined) out[key] = typed
  }
  return out
}

/** Notion's message when a database does not have this column yet. */
export function unknownNotionProperty(message: string): string | null {
  const match = message.trim().match(/^(.*?) is not a property that exists\b/i)
  const name = match?.[1]?.trim()
  return name || null
}

/** Drop one missing column so the rest of the page can still sync. Returns null for any other error. */
export function withoutUnknownNotionProperty(
  properties: Record<string, unknown>,
  message: string,
): Record<string, unknown> | null {
  const name = unknownNotionProperty(message)
  if (!name || !Object.prototype.hasOwnProperty.call(properties, name)) return null
  const next = { ...properties }
  delete next[name]
  return next
}

export async function writeNotionProperties(
  properties: Record<string, unknown>,
  write: (properties: Record<string, unknown>) => Promise<{ ok: true } | { ok: false; message: string }>,
): Promise<{ ok: true } | { ok: false; message: string }> {
  let current = properties
  const limit = Object.keys(properties).length + 1
  for (let attempt = 0; attempt < limit; attempt += 1) {
    const result = await write(current)
    if (result.ok) return { ok: true }
    const next = withoutUnknownNotionProperty(current, result.message)
    if (!next) return { ok: false, message: result.message || "Notion write failed" }
    current = next
  }
  return { ok: false, message: "Notion write failed" }
}

export function toNotionApiValue(type: FieldType, value: unknown) {
  if (value === undefined || value === null || value === "") return undefined
  if (type === "title") return { title: [{ type: "text", text: { content: String(value).slice(0, 2000) } }] }
  if (type === "text") return { rich_text: [{ type: "text", text: { content: String(value).slice(0, 2000) } }] }
  if (type === "phone") return { phone_number: String(value) }
  if (type === "email") return { email: String(value) }
  if (type === "select") return { select: { name: String(value) } }
  if (type === "multi") return { multi_select: (Array.isArray(value) ? value : [String(value)]).map((name) => ({ name: String(name) })) }
  if (type === "date") {
    const text = String(value).trim()
    if (/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(text)) return { date: { start: text } }
    const parsed = parseCalendarDate(text)
    if (!parsed) return undefined
    return { date: { start: parsed } }
  }
  if (type === "checkbox") return { checkbox: Boolean(value) }
  if (type === "number") return { number: Number(value) }
  return undefined
}
