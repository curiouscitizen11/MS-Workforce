import { asTicketInputs, earliestExpiry } from "@/lib/portal/compliance"
import { sensitiveFindings } from "@/lib/portal/privacy"
import {
  EXPERIENCE_LEVELS,
  FITNESS_OPTIONS,
  OFFER_STATUSES,
  RTW_OPTIONS,
  TICKET_ANSWERS,
  TICKET_LABELS,
  VEVO_METHODS,
  VEVO_RESULTS,
  VERIFICATION_METHODS,
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
  "Medical notes",
  "Work history",
])

export class NotionPayloadError extends Error {}

export function assertNotionPayloadSafe(properties: Record<string, unknown>) {
  for (const key of Object.keys(properties)) {
    const lower = key.toLowerCase()
    if (BANNED.some((word) => lower.includes(word))) {
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

function ticketChoice(status: string | undefined) {
  if (!status) return undefined
  return choice(status, TICKET_ANSWERS)
}

function rtwChoice(value: string | undefined) {
  const mapped = value === "Citizen - passport" ? "Australian citizen" : value === "Visa - VEVO" ? "Visa holder" : value
  return choice(mapped, RTW_OPTIONS)
}

function fitnessChoice(value: string | undefined) {
  const mapped = value === "Yes" ? "Yes, I can safely do these tasks" : value
  return choice(mapped, FITNESS_OPTIONS)
}

export function workerNotionProperties(worker: Worker): Record<string, unknown> {
  const props: Record<string, unknown> = {}
  put(props, "Name", worker.name)
  put(props, "Mobile", worker.mobile)
  put(props, "Email", worker.email)
  put(props, "Suburb", worker.suburb)
  if (worker.roles.length) props["Roles of interest"] = worker.roles
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
  put(props, "Emergency relationship", worker.emergencyRelationship)
  put(props, "Experience level", worker.experienceLevel ? choice(worker.experienceLevel, EXPERIENCE_LEVELS) : undefined)
  put(props, "Work history", worker.workHistory)
  put(props, "Available from", worker.availableFrom)
  if (worker.workAreas?.length) props["Work areas"] = worker.workAreas
  if (worker.workDays?.length) props["Work days"] = worker.workDays
  put(props, "RTW evidence", rtwChoice(worker.rtw))
  put(props, "Right to work", worker.rightToWork)
  props["VEVO consent"] = Boolean(worker.vevoConsent)
  put(props, "Visa subclass", worker.visaSubclass)
  put(props, "Visa expiry", worker.visaExpiry)
  put(props, "VEVO method", worker.vevoMethod ? choice(worker.vevoMethod, VEVO_METHODS) : undefined)
  put(props, "VEVO result", worker.vevoResult ? choice(worker.vevoResult, VEVO_RESULTS) : undefined)
  put(props, "VEVO checked on", worker.vevoCheckedOn)
  put(props, "White card", ticketChoice(worker.tickets.whiteCard.status))
  put(props, "Work at heights", ticketChoice(worker.tickets.heights.status))
  put(props, "Asbestos class A", ticketChoice(worker.tickets.asbestosA.status))
  put(props, "Asbestos class B", ticketChoice(worker.tickets.asbestosB.status))
  put(props, "Confined space", ticketChoice(worker.tickets.confinedSpace.status))
  put(props, "Driver licence", ticketChoice(worker.tickets.driverLicence.status))
  put(props, "First aid", ticketChoice(worker.tickets.firstAid.status))
  put(props, "Other tickets", worker.tickets.other.note || (worker.tickets.other.status === "No" ? undefined : worker.tickets.other.status))
  put(props, "Next ticket expiry", earliestExpiry(asTicketInputs(worker.tickets), null))
  if (worker.otherTicketsHeld?.length) props["Other tickets held"] = worker.otherTicketsHeld
  put(props, "Transport", worker.transport)
  put(props, "Fitness declaration", fitnessChoice(worker.fitness))
  put(props, "Construction work in last 2 years", worker.constructionRecent)
  put(props, "Driver licence state", worker.licenceState)
  if (typeof worker.daConsent === "boolean") props["D&A consent"] = worker.daConsent
  if (typeof worker.declaration === "boolean") props.Declaration = worker.declaration
  if (typeof worker.idSighted === "boolean") props["ID sighted"] = worker.idSighted
  put(props, "ID sighted method", worker.idSightedMethod)
  put(props, "ID sighted on", worker.idSightedOn)
  put(props, "Allergies", worker.allergies)
  if (worker.allergyTypes?.length) props["Allergy types"] = worker.allergyTypes
  put(props, "Anaphylaxis risk", worker.anaphylaxis)
  put(props, "Carries EpiPen", worker.epipen)
  if (worker.medicalConditions?.length) props["Medical conditions"] = worker.medicalConditions
  put(props, "Medical notes", worker.medicalNotes)
  put(props, "Injury affecting duties", worker.injury)
  if (worker.tasksAffected?.length) props["Tasks affected"] = worker.tasksAffected
  put(props, "Safety medication", worker.safetyMedication)
  put(props, "Medical sharing", worker.medicalSharing)
  props["Health info consent"] = Boolean(worker.healthConsent)
  props["Policies acknowledged"] = Boolean(worker.policiesAck)
  props["Contract accepted in form"] = Boolean(worker.contractAccepted)
  put(props, "Onboarding submitted", worker.onboardingSubmitted)
  put(props, "Terms signed", worker.termsSignedOn)
  put(props, "Form status", worker.formStatus)
  put(props, "Induction passed", worker.inductionPassed)
  if (typeof worker.inductionScore === "number") props["Induction score"] = worker.inductionScore
  put(props, "Induction version", worker.inductionVersion)
  props["Tickets verified"] = Boolean(worker.ticketsVerified)
  put(props, "Verified on", worker.verifiedOn)
  put(props, "Verified by", worker.verifiedBy)
  put(props, "Verification method", worker.verificationMethod ? choice(worker.verificationMethod, VERIFICATION_METHODS) : undefined)
  put(props, "Images deleted on", worker.imagesDeletedOn)
  put(props, "Notes", worker.notes)
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
  put(props, "Hours (form)", String(sheet.totalHours))
  props["Total hours"] = sheet.totalHours
  if (sheet.tasks.length) props.Tasks = sheet.tasks
  props["Incident reported"] = sheet.incident
  put(props, "Incident note", sheet.incidentNote)
  put(props, "Query note", sheet.workerNote)
  put(props, "Worker confirmed", sheet.workerConfirmedAt)
  put(props, "Approved by", sheet.supervisorName)
  put(props, "Approver role", sheet.supervisorRole)
  put(props, "Approved at", sheet.approvedAt)
  put(props, "Pay fortnight", sheet.payFortnight)
  props["Signer mismatch"] = Boolean(sheet.signerMismatch)
  props["Corrected by MS Workforce"] = Boolean(sheet.corrected)
  assertNotionPayloadSafe(props)
  return props
}

type FieldType = "title" | "text" | "phone" | "email" | "select" | "multi" | "date" | "checkbox" | "number"

const TITLE_FIELDS = new Set(["Name", "Offer", "Entry"])
const PHONE_FIELDS = new Set(["Mobile", "Emergency phone", "Site phone"])
const EMAIL_FIELDS = new Set(["Email"])
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
  "Form status",
  "Verification method",
  "Role",
  "Source",
  "Experience level",
  "VEVO method",
])
const DATE_FIELDS = new Set([
  "Date of birth",
  "VEVO checked on",
  "White card expiry",
  "White card issued",
  "Work at heights expiry",
  "Asbestos class A expiry",
  "Asbestos class B expiry",
  "Confined space expiry",
  "Driver licence expiry",
  "First aid expiry",
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
])
const NUMBER_FIELDS = new Set(["Induction score", "Expected hours", "Total hours"])

export function toNotionProperties(flat: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(flat)) {
    if (value === undefined || value === null || value === "") continue
    let typed: unknown
    if (TITLE_FIELDS.has(key)) typed = toNotionApiValue("title", value)
    else if (PHONE_FIELDS.has(key)) typed = toNotionApiValue("phone", value)
    else if (EMAIL_FIELDS.has(key)) typed = toNotionApiValue("email", value)
    else if (SELECT_FIELDS.has(key)) typed = toNotionApiValue("select", value)
    else if (DATE_FIELDS.has(key)) typed = toNotionApiValue("date", value)
    else if (NUMBER_FIELDS.has(key) || typeof value === "number") typed = toNotionApiValue("number", value)
    else if (typeof value === "boolean") typed = toNotionApiValue("checkbox", value)
    else if (Array.isArray(value)) typed = toNotionApiValue("multi", value)
    else typed = toNotionApiValue("text", value)
    if (typed !== undefined) out[key] = typed
  }
  return out
}

export function toNotionApiValue(type: FieldType, value: unknown) {
  if (value === undefined || value === null || value === "") return undefined
  if (type === "title") return { title: [{ type: "text", text: { content: String(value).slice(0, 2000) } }] }
  if (type === "text") return { rich_text: [{ type: "text", text: { content: String(value).slice(0, 2000) } }] }
  if (type === "phone") return { phone_number: String(value) }
  if (type === "email") return { email: String(value) }
  if (type === "select") return { select: { name: String(value) } }
  if (type === "multi") return { multi_select: (Array.isArray(value) ? value : [String(value)]).map((name) => ({ name: String(name) })) }
  if (type === "date") return { date: { start: String(value) } }
  if (type === "checkbox") return { checkbox: Boolean(value) }
  if (type === "number") return { number: Number(value) }
  return undefined
}
