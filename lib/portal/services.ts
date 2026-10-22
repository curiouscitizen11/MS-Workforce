import {
  ADMIN_SESSION_MS,
  DOCUMENT_KEEP_MS,
  MAGIC_TTL_MS,
  OTP_IP_MAX,
  OTP_IP_WINDOW_MS,
  OTP_LOCK_MS,
  OTP_MAX_ATTEMPTS,
  OTP_MAX_SENDS,
  OTP_SEND_WINDOW_MS,
  OTP_TTL_MS,
  PASSPORT_TTL_MS,
  WORKER_SESSION_MS,
  adminEmail,
  adminMobile,
  sessionSecret,
} from "@/lib/portal/config"
import {
  asTicketInputs,
  assessTickets,
  canAcceptShift,
  dueReminderStage,
  earliestExpiry,
  foldLicenceExpiries,
  warningWindowDays,
} from "@/lib/portal/compliance"
import { decryptString } from "@/lib/portal/crypto"
import { emailError, emailProblem } from "@/lib/portal/email"
import { WHAT_TO_BRING } from "@/lib/portal/seed"
import { addDays, daysBetween, formatDate, isMondayInSydney, sydneyParts, sydneyToday } from "@/lib/portal/dates"
import { deletePrivateBlob, storePrivateBlob } from "@/lib/portal/blob"
import { contentTypeFor, sniffFile, stripJpegExif } from "@/lib/portal/files"
import {
  TICKET_PHOTO_MAX_BYTES,
  TICKET_PHOTO_TYPES,
  activeTicketPhotos,
  heldLicenceExpiries,
  isOtherLicence,
  isPhotoLicenceKey,
  isTicketType,
  licenceLabel,
  missingPhotoMessage,
  requiredPhotoSlots,
  slotsFromWorker,
} from "@/lib/portal/ticket-photos"
import { formatHours, hoursWarnings, onQuarterHour, paidHours } from "@/lib/portal/hours"
import { MS_PHONE, fortnightContaining, olderThanDays, payFortnight, timesheetReminder } from "@/lib/portal/pay"
import { randomInt } from "crypto"
import { newId, sha256 } from "@/lib/portal/id"
import { INDUCTION_VERSION, scoreAnswers } from "@/lib/portal/induction"
import { offerNotionProperties, timesheetNotionProperties, toNotionProperties, workerNotionProperties } from "@/lib/portal/notion/map"
import { toE164 } from "@/lib/portal/phone"
import { SENSITIVE_MESSAGE, sensitiveMessage } from "@/lib/portal/privacy"
import { ticketEntryProblem, ticketNumberProblem, type TicketEntry } from "@/lib/portal/ticket-entry"
import type { Notify } from "@/lib/portal/notify"
import type { Store } from "@/lib/portal/store"
import {
  OTHER_TICKETS,
  ROLES,
  SUPERVISOR_ROLES,
  TICKET_ANSWERS,
  TICKET_LABELS,
  TICKET_TYPES,
  TIMESHEET_TASKS,
  VEVO_RESULTS,
  VERIFICATION_METHODS,
  type LicenceCheck,
  type Offer,
  type PhotoSide,
  type Session,
  type Ticket,
  type TicketType,
  type Timesheet,
  type Worker,
} from "@/lib/portal/types"
import { z } from "zod"

export type Ctx = {
  store: Store
  now: Date
  mode: "mock" | "live"
  notify: Notify
}

type Err = { ok: false; error: string; code?: string }

function fail(error: string, code?: string): Err {
  return { ok: false, error, code }
}

function pepper(code: string) {
  return sha256(sessionSecret() + ":" + code)
}

async function audit(ctx: Ctx, actorId: string, action: string, target: string, detail?: string) {
  await ctx.store.audits.save({
    id: newId("aud"),
    at: ctx.now.toISOString(),
    actorId,
    action,
    target,
    detail,
  })
}

async function enqueue(ctx: Ctx, kind: string, payload: Record<string, unknown>) {
  await ctx.store.outbox.save({
    id: newId("out"),
    kind,
    payload,
    status: ctx.mode === "mock" ? "skipped-mock" : "pending",
    attempts: 0,
    nextAttemptAt: ctx.now.toISOString(),
    createdAt: ctx.now.toISOString(),
  })
}

async function persistWorker(ctx: Ctx, worker: Worker) {
  const properties = workerNotionProperties(worker)
  worker.updatedAt = ctx.now.toISOString()
  await ctx.store.workers.save(worker)
  await enqueue(ctx, "workers", { mobile: worker.mobile, properties })
}

async function findWorkerByMobile(ctx: Ctx, mobile: string) {
  return (await ctx.store.workers.all()).find((worker) => worker.mobile === mobile) || null
}

function texts(values: Array<string | undefined>) {
  const hit = values.map((value) => (value ? sensitiveMessage(value) : null)).find(Boolean)
  return hit || null
}

async function alertMav(ctx: Ctx, subject: string, body: string) {
  await ctx.notify.email({ to: adminEmail(), subject, body })
  await ctx.notify.whatsapp(adminMobile(), subject + "\n" + body)
}

function within(iso: string, now: Date, windowMs: number) {
  return now.getTime() - Date.parse(iso) <= windowMs
}

export function loginSms(code: string) {
  return code + " is your MS Workforce code. It expires in 10 minutes.\n\n@www.msworkforce.au #" + code
}

export async function requestOtp(ctx: Ctx, input: { mobile: string; ip: string }) {
  const mobile = toE164(input.mobile)
  if (!mobile) return fail("Enter an Australian mobile, like 0400 000 000.")
  const worker = await findWorkerByMobile(ctx, mobile)
  if (!worker) return fail("That mobile is not on file. Apply for work first.", "unknown")
  if (worker.status === "Inactive") return fail("This account is inactive. Call MS Workforce on " + MS_PHONE + ".")
  const challenges = await ctx.store.challenges.all()
  const recent = challenges.filter((item) => item.target === mobile && within(item.createdAt, ctx.now, OTP_SEND_WINDOW_MS))
  if (recent.some((item) => item.lockedUntil && Date.parse(item.lockedUntil) > ctx.now.getTime())) {
    return fail("Too many tries. Wait 15 minutes, then request a new code.", "locked")
  }
  if (recent.length >= OTP_MAX_SENDS) return fail("Wait a few minutes before asking for another code.", "rate")
  const ipCount = challenges.filter((item) => item.ip === input.ip && within(item.createdAt, ctx.now, OTP_IP_WINDOW_MS)).length
  if (ipCount >= OTP_IP_MAX) return fail("Too many codes from this connection. Try again later.", "rate")
  const code = String(randomInt(0, 1000000)).padStart(6, "0")
  await ctx.store.challenges.save({
    id: newId("otp"),
    target: mobile,
    channel: "sms",
    codeHash: pepper(code),
    expiresAt: new Date(ctx.now.getTime() + OTP_TTL_MS).toISOString(),
    attempts: 0,
    createdAt: ctx.now.toISOString(),
    ip: input.ip,
  })
  await ctx.notify.sms(mobile, loginSms(code), "Login code sent")
  return { ok: true as const, devCode: ctx.mode === "mock" ? code : undefined }
}

export async function verifyOtp(ctx: Ctx, input: { mobile: string; code: string }) {
  const mobile = toE164(input.mobile)
  if (!mobile) return fail("Enter an Australian mobile, like 0400 000 000.")
  const challenges = (await ctx.store.challenges.all())
    .filter((item) => item.target === mobile && !item.consumedAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const latest = challenges[0]
  if (!latest) return fail("Request a code first.")
  if (latest.lockedUntil && Date.parse(latest.lockedUntil) > ctx.now.getTime()) {
    return fail("Too many tries. Wait 15 minutes, then request a new code.", "locked")
  }
  if (Date.parse(latest.expiresAt) < ctx.now.getTime()) return fail("That code has expired. Request a new one.")
  if (latest.codeHash !== pepper(input.code.trim())) {
    latest.attempts += 1
    if (latest.attempts >= OTP_MAX_ATTEMPTS) {
      latest.lockedUntil = new Date(ctx.now.getTime() + OTP_LOCK_MS).toISOString()
    }
    await ctx.store.challenges.save(latest)
    return fail(
      latest.lockedUntil ? "Too many tries. Wait 15 minutes, then request a new code." : "That code is not right.",
      latest.lockedUntil ? "locked" : "bad-code",
    )
  }
  latest.consumedAt = ctx.now.toISOString()
  await ctx.store.challenges.save(latest)
  const worker = await findWorkerByMobile(ctx, mobile)
  if (!worker || worker.status === "Inactive") return fail("This account is inactive. Call MS Workforce on " + MS_PHONE + ".")
  if (worker.role === "admin") return { ok: true as const, needsTotp: true as const, workerId: worker.id }
  const session = await openSession(ctx, worker)
  return { ok: true as const, needsTotp: false as const, session }
}

export async function confirmAdminTotp(ctx: Ctx, workerId: string, code: string) {
  const { adminTotpSecret } = await import("@/lib/portal/config")
  const { verifyTotp } = await import("@/lib/portal/totp")
  const worker = await ctx.store.workers.get(workerId)
  if (!worker || worker.role !== "admin") return fail("Mav's login is required.")
  if (!verifyTotp(code, adminTotpSecret(), ctx.now.getTime())) return fail("That authenticator code is not right.")
  const session = await openSession(ctx, worker)
  return { ok: true as const, session }
}

async function openSession(ctx: Ctx, worker: Worker): Promise<Session> {
  const session: Session = {
    id: newId("ses"),
    workerId: worker.id,
    role: worker.role,
    createdAt: ctx.now.toISOString(),
    expiresAt: new Date(ctx.now.getTime() + (worker.role === "admin" ? ADMIN_SESSION_MS : WORKER_SESSION_MS)).toISOString(),
  }
  await ctx.store.sessions.save(session)
  await audit(ctx, worker.id, "login", worker.id)
  return session
}

export async function renewWorkerSession(ctx: Ctx, sessionId: string) {
  const session = await ctx.store.sessions.get(sessionId)
  if (!session || session.role !== "worker") return { ok: true as const, renewed: false as const }
  const next = { ...session, expiresAt: new Date(ctx.now.getTime() + WORKER_SESSION_MS).toISOString() }
  await ctx.store.sessions.save(next)
  return { ok: true as const, renewed: true as const, session: next }
}

export async function requestMagicLink(ctx: Ctx, input: { email: string; confirmEmail: string; origin: string }) {
  const problem = emailProblem(input.email, input.confirmEmail, true)
  if (problem) return fail(emailError(problem))
  const email = input.email.trim().toLowerCase()
  const worker = (await ctx.store.workers.all()).find((item) => item.email?.toLowerCase() === email)
  if (!worker) return fail("That email is not on file. Try your mobile instead.", "unknown")
  if (worker.status === "Inactive") return fail("This account is inactive. Call MS Workforce on " + MS_PHONE + ".")
  const token = newId("magic") + newId()
  await ctx.store.magics.save({
    id: sha256(token),
    workerId: worker.id,
    expiresAt: new Date(ctx.now.getTime() + MAGIC_TTL_MS).toISOString(),
  })
  const link = input.origin.replace(/\/$/, "") + "/api/portal/auth/magic?token=" + token
  await ctx.notify.email({
    to: email,
    subject: "Your MS Workforce login link",
    body: "Tap this link to log in. It expires in 30 minutes.\n\n" + link,
  })
  return { ok: true as const, devLink: ctx.mode === "mock" ? link : undefined }
}

export async function consumeMagicLink(ctx: Ctx, token: string) {
  const row = await ctx.store.magics.get(sha256(token))
  if (!row || row.usedAt || Date.parse(row.expiresAt) < ctx.now.getTime()) {
    return fail("That login link has expired. Request a new one.")
  }
  row.usedAt = ctx.now.toISOString()
  await ctx.store.magics.save(row)
  const worker = await ctx.store.workers.get(row.workerId)
  if (!worker || worker.status === "Inactive") return fail("This account is inactive. Call MS Workforce on " + MS_PHONE + ".")
  if (worker.role === "admin") return { ok: true as const, needsTotp: true as const, workerId: worker.id }
  const session = await openSession(ctx, worker)
  return { ok: true as const, needsTotp: false as const, session }
}

const applySchema = z.object({
  name: z.string().trim().min(2).max(80),
  mobile: z.string(),
  email: z.string().trim().max(120).optional(),
  confirmEmail: z.string().trim().max(120).optional(),
  suburb: z.string().trim().min(2).max(80),
  roles: z.array(z.enum(ROLES)).min(1),
  experience: z.string().trim().max(1000).optional(),
  whatsappOk: z.boolean(),
  privacyConsent: z.literal(true),
  tickets: z.object({
    whiteCard: z.enum(TICKET_ANSWERS),
    heights: z.enum(TICKET_ANSWERS),
    asbestosA: z.enum(TICKET_ANSWERS),
    asbestosB: z.enum(TICKET_ANSWERS),
    confinedSpace: z.enum(TICKET_ANSWERS),
    firstAid: z.enum(TICKET_ANSWERS),
    driverLicence: z.enum(TICKET_ANSWERS),
  }),
})

export async function submitApplication(ctx: Ctx, input: unknown) {
  const parsed = applySchema.safeParse(input)
  if (!parsed.success) return fail("Check the form and try again.")
  const data = parsed.data
  const sensitive = texts([data.name, data.experience, data.suburb, data.email])
  if (sensitive) return fail(sensitive)
  const mobile = toE164(data.mobile)
  if (!mobile) return fail("Enter an Australian mobile, like 0400 000 000.")
  const emailProblemFound = emailProblem(data.email || "", data.confirmEmail || "")
  if (emailProblemFound) return fail(emailError(emailProblemFound))
  const email = (data.email || "").trim()
  const existing = await findWorkerByMobile(ctx, mobile)
  if (existing?.role === "admin") return fail("Use the admin login for this mobile.")
  if (existing && existing.status !== "Applicant") {
    return fail("Looks like you've already applied. Log in instead.", "exists")
  }
  const nowIso = ctx.now.toISOString()
  const worker: Worker = existing || {
    id: newId("w"),
    role: "worker",
    name: data.name,
    mobile,
    status: "Applicant",
    roles: [],
    whatsappOk: false,
    privacyConsent: false,
    tickets: {
      whiteCard: { status: "No" },
      heights: { status: "No" },
      asbestosA: { status: "No" },
      asbestosB: { status: "No" },
      confinedSpace: { status: "No" },
      firstAid: { status: "No" },
      driverLicence: { status: "No" },
      other: { status: "No" },
    },
    createdAt: nowIso,
    updatedAt: nowIso,
  }
  worker.name = data.name
  worker.mobile = mobile
  worker.email = email || worker.email
  worker.suburb = data.suburb
  worker.roles = data.roles
  worker.experience = data.experience
  worker.whatsappOk = data.whatsappOk
  worker.privacyConsent = true
  worker.status = "Applicant"
  for (const type of ["whiteCard", "heights", "asbestosA", "asbestosB", "confinedSpace", "firstAid", "driverLicence"] as const) {
    worker.tickets[type] = { ...worker.tickets[type], status: data.tickets[type] }
  }
  await persistWorker(ctx, worker)
  await audit(ctx, worker.id, existing ? "apply-update" : "apply", worker.id)
  return { ok: true as const, created: !existing }
}

export async function saveOnboarding(ctx: Ctx, workerId: string, patch: Record<string, unknown>) {
  const worker = await ctx.store.workers.get(workerId)
  if (!worker || worker.role !== "admin" && worker.id !== workerId) return fail("Log in again.")
  if (worker.role === "admin") return fail("Admin accounts do not onboard.")
  const sensitive = texts([
    stringOf(patch.address),
    stringOf(patch.emergencyContact),
    stringOf(patch.visaSubclass),
    stringOf(patch.typedName),
    stringOf(patch.preferredName),
    stringOf(patch.workHistory),
    stringOf(patch.medicalNotes),
    stringOf(patch.injury),
  ])
  if (sensitive) return fail(SENSITIVE_MESSAGE)
  if (typeof patch.dob === "string") worker.dob = patch.dob
  if (typeof patch.preferredName === "string") worker.preferredName = patch.preferredName
  if (typeof patch.address === "string") worker.address = patch.address
  if (typeof patch.postcode === "string") worker.postcode = patch.postcode
  if (typeof patch.emergencyContact === "string") worker.emergencyContact = patch.emergencyContact
  if (typeof patch.emergencyRelationship === "string") worker.emergencyRelationship = patch.emergencyRelationship
  if (typeof patch.emergencyPhone === "string") worker.emergencyPhone = toE164(patch.emergencyPhone) || patch.emergencyPhone
  if (typeof patch.rtw === "string") {
    worker.rtw = patch.rtw === "Citizen - passport" ? "Australian citizen" : patch.rtw === "Visa - VEVO" ? "Visa holder" : patch.rtw
    if (worker.rtw === "Australian citizen" || worker.rtw === "Permanent resident" || worker.rtw === "New Zealand citizen") {
      worker.rightToWork = "Yes"
    }
  }
  if (typeof patch.vevoConsent === "boolean") worker.vevoConsent = patch.vevoConsent
  if (typeof patch.vevoMethod === "string") worker.vevoMethod = patch.vevoMethod
  if (typeof patch.visaSubclass === "string") worker.visaSubclass = patch.visaSubclass
  if (typeof patch.visaExpiry === "string") worker.visaExpiry = patch.visaExpiry
  worker.visaConditions = undefined
  if (Array.isArray(patch.workAreas)) worker.workAreas = patch.workAreas.map(String)
  if (Array.isArray(patch.workDays)) worker.workDays = patch.workDays.map(String)
  if (typeof patch.experienceLevel === "string") worker.experienceLevel = patch.experienceLevel
  if (typeof patch.workHistory === "string") worker.workHistory = patch.workHistory
  if (typeof patch.availableFrom === "string") worker.availableFrom = patch.availableFrom
  if (typeof patch.constructionRecent === "string") worker.constructionRecent = patch.constructionRecent
  if (typeof patch.transport === "string") worker.transport = patch.transport
  if (typeof patch.fitness === "string") {
    worker.fitness = patch.fitness === "Yes" ? "Yes, I can safely do these tasks" : patch.fitness
  }
  if (typeof patch.allergies === "string") worker.allergies = patch.allergies
  if (Array.isArray(patch.allergyTypes)) worker.allergyTypes = patch.allergyTypes.map(String)
  if (typeof patch.anaphylaxis === "string") worker.anaphylaxis = patch.anaphylaxis
  if (typeof patch.epipen === "string") worker.epipen = patch.epipen
  if (Array.isArray(patch.medicalConditions)) worker.medicalConditions = patch.medicalConditions.map(String)
  if (typeof patch.injury === "string") worker.injury = patch.injury
  if (Array.isArray(patch.tasksAffected)) worker.tasksAffected = patch.tasksAffected.map(String)
  if (typeof patch.safetyMedication === "string") worker.safetyMedication = patch.safetyMedication
  if (typeof patch.medicalSharing === "string") worker.medicalSharing = patch.medicalSharing
  if (typeof patch.medicalNotes === "string") worker.medicalNotes = patch.medicalNotes
  if (typeof patch.licenceState === "string") worker.licenceState = patch.licenceState
  if (typeof patch.daConsent === "boolean") worker.daConsent = patch.daConsent
  if (typeof patch.declaration === "boolean") worker.declaration = patch.declaration
  if (typeof patch.healthConsent === "boolean") worker.healthConsent = patch.healthConsent
  if (typeof patch.policiesAck === "boolean") worker.policiesAck = patch.policiesAck
  if (typeof patch.contractReceived === "string") worker.contractReceived = patch.contractReceived
  if (typeof patch.contractAccepted === "boolean") worker.contractAccepted = patch.contractAccepted
  if (typeof patch.privacyConsent === "boolean") worker.privacyConsent = patch.privacyConsent
  if (typeof patch.signaturePng === "string") worker.signaturePng = patch.signaturePng
  if (worker.status === "Applicant") worker.status = "Onboarding"
  if (patch.finish === true) {
    if (!worker.signaturePng || !stringOf(patch.typedName)) return fail("Type your name and sign to finish.")
    if (!worker.policiesAck || !worker.privacyConsent || !worker.healthConsent || !worker.declaration) {
      return fail("Tick the policy, privacy, health and fitness boxes to finish.")
    }
    if (!worker.onboardingSubmitted) {
      const missing = missingPhotoMessage(slotsFromWorker(worker), await workerDocs(ctx, workerId), workerId)
      if (missing) return fail(missing)
    }
    const today = sydneyToday(ctx.now)
    worker.termsSignedOn = today
    worker.onboardingSubmitted = today
    worker.formStatus = "Onboarding complete"
  }
  await persistWorker(ctx, worker)
  await audit(ctx, worker.id, "onboarding", worker.id)
  return { ok: true as const }
}

export async function saveMyDetails(
  ctx: Ctx,
  workerId: string,
  input: { preferredName: string; suburb: string; postcode: string },
) {
  const worker = await ctx.store.workers.get(workerId)
  if (!worker || worker.role !== "worker") return fail("Log in again.")
  const sensitive = texts([input.preferredName, input.suburb, input.postcode])
  if (sensitive) return fail(SENSITIVE_MESSAGE)
  worker.preferredName = input.preferredName.trim()
  worker.suburb = input.suburb.trim()
  worker.postcode = input.postcode.trim()
  await persistWorker(ctx, worker)
  await audit(ctx, workerId, "update-details", workerId, "Updated preferred name, suburb or postcode.")
  return { ok: true as const }
}

export async function readSafety(ctx: Ctx, actorId: string, workerId: string) {
  const actor = await ctx.store.workers.get(actorId)
  const worker = await ctx.store.workers.get(workerId)
  if (!actor || !worker || worker.role !== "worker") return fail("Log in again.")
  if (actor.role !== "admin" && actor.id !== workerId) return fail("You can't open another person's safety info.")
  return {
    ok: true as const,
    safety: {
      emergencyContact: worker.emergencyContact || "",
      emergencyRelationship: worker.emergencyRelationship || "",
      emergencyPhone: worker.emergencyPhone || "",
      allergies: worker.allergies || "",
      allergyTypes: worker.allergyTypes || [],
      anaphylaxis: worker.anaphylaxis || "",
      epipen: worker.epipen || "",
      medicalConditions: worker.medicalConditions || [],
      injury: worker.injury || "",
      tasksAffected: worker.tasksAffected || [],
      safetyMedication: worker.safetyMedication || "",
      medicalSharing: worker.medicalSharing || "",
      healthConsent: Boolean(worker.healthConsent),
    },
  }
}

export async function saveSafety(
  ctx: Ctx,
  workerId: string,
  input: {
    consent: boolean
    emergencyContact: string
    emergencyRelationship: string
    emergencyPhone: string
    allergies: string
    allergyTypes: string[]
    anaphylaxis: string
    epipen: string
    medicalConditions: string[]
    injury: string
    tasksAffected: string[]
    safetyMedication: string
    medicalSharing: string
  },
) {
  const worker = await ctx.store.workers.get(workerId)
  if (!worker || worker.role !== "worker") return fail("Log in again.")
  if (!input.consent) return fail("Tick the box to let MS Workforce keep this.")
  const sensitive = texts([input.emergencyContact, input.emergencyPhone, input.injury])
  if (sensitive) return fail(SENSITIVE_MESSAGE)
  worker.emergencyContact = input.emergencyContact.trim()
  worker.emergencyRelationship = input.emergencyRelationship
  worker.emergencyPhone = toE164(input.emergencyPhone) || input.emergencyPhone.trim()
  worker.allergies = input.allergies
  worker.allergyTypes = input.allergyTypes
  worker.anaphylaxis = input.anaphylaxis
  worker.epipen = input.epipen
  worker.medicalConditions = input.medicalConditions
  worker.injury = input.injury.trim()
  worker.tasksAffected = input.tasksAffected
  worker.safetyMedication = input.safetyMedication
  worker.medicalSharing = input.medicalSharing
  worker.healthConsent = true
  await persistWorker(ctx, worker)
  await audit(ctx, workerId, "update-safety", workerId, "Safety info updated.")
  return { ok: true as const }
}

function stringOf(value: unknown) {
  return typeof value === "string" ? value : ""
}

function freshTicket(status: string): Ticket {
  return {
    status,
    pendingCheck: status === "Yes, I have it",
  }
}

function withWorkerEntry(previous: Ticket | undefined, status: string, entry: TicketEntry, today: string): { ok: true; ticket: Ticket; changed: boolean } | { ok: false; error: string } {
  if (status !== "Yes, I have it") return { ok: true, ticket: freshTicket(status), changed: previous?.status !== status || Boolean(previous?.checkedAt) }
  const problem = ticketEntryProblem(entry, today)
  if (problem) return { ok: false, error: problem }
  const number = (entry.number || "").trim()
  const expiry = entry.noExpiry ? null : entry.expiry || null
  const changed = !previous?.checkedAt || previous.number !== number || (previous.expiry || null) !== expiry || previous.status !== status
  return {
    ok: true,
    changed,
    ticket: {
      status,
      number,
      expiry,
      pendingCheck: changed,
      checkedBy: changed ? undefined : previous?.checkedBy,
      checkedAt: changed ? undefined : previous?.checkedAt,
      photosDeletedAt: changed ? undefined : previous?.photosDeletedAt,
    },
  }
}

async function workerDocs(ctx: Ctx, workerId: string) {
  return (await ctx.store.documents.all()).filter((doc) => doc.workerId === workerId)
}

export async function saveTicket(ctx: Ctx, workerId: string, type: TicketType, ticket: Ticket & TicketEntry) {
  const worker = await ctx.store.workers.get(workerId)
  if (!worker) return fail("Log in again.")
  if (!TICKET_ANSWERS.includes(ticket.status as (typeof TICKET_ANSWERS)[number])) return fail("Choose one of the listed options.")
  const docs = await workerDocs(ctx, workerId)
  if (ticket.status === "Yes, I have it") {
    const missing = missingPhotoMessage([{ key: type, label: TICKET_LABELS[type] }], docs, workerId)
    if (missing) return fail(missing)
  }
  const built = withWorkerEntry(worker.tickets[type], ticket.status, ticket, sydneyToday(ctx.now))
  if (!built.ok) return fail(built.error)
  if (ticket.status !== "Yes, I have it") await deleteLicencePhotos(ctx, workerId, type, workerId, "Removed because the worker no longer holds this card.")
  else if (built.changed) await clearPhotoSchedule(ctx, workerId, type)
  worker.tickets[type] = built.ticket
  if (built.changed) {
    worker.ticketsVerified = allHeldChecked(worker)
    const note = "Ticket updated in the portal on " + sydneyToday(ctx.now) + ". Needs a new check."
    worker.notes = worker.notes ? worker.notes + "\n" + note : note
  }
  await persistWorker(ctx, worker)
  await audit(ctx, workerId, "ticket-update", type)
  return { ok: true as const }
}

export async function saveTicketAnswers(
  ctx: Ctx,
  workerId: string,
  input: {
    tickets: Partial<Record<TicketType, string | TicketEntry & { status?: string }>>
    otherTicketsHeld: string[]
    otherDetails?: Record<string, TicketEntry>
  },
) {
  const worker = await ctx.store.workers.get(workerId)
  if (!worker) return fail("Log in again.")
  const today = sydneyToday(ctx.now)
  const answers = {} as Record<TicketType, TicketEntry & { status: string }>
  for (const type of TICKET_TYPES) {
    const raw = input.tickets[type]
    const answer = typeof raw === "string" || !raw ? { status: raw || "No" } : { status: raw.status || "No", number: raw.number, expiry: raw.expiry, noExpiry: raw.noExpiry }
    if (!TICKET_ANSWERS.includes(answer.status as (typeof TICKET_ANSWERS)[number])) return fail("Choose one of the listed options.")
    answers[type] = answer
  }
  const held = input.otherTicketsHeld.map(String)
  if (held.some((item) => !(OTHER_TICKETS as readonly string[]).includes(item))) return fail("Choose tickets from the list.")
  const statusMap = {} as Record<TicketType, string>
  for (const type of TICKET_TYPES) statusMap[type] = answers[type].status
  const docs = await workerDocs(ctx, workerId)
  const missing = missingPhotoMessage(requiredPhotoSlots({ tickets: statusMap, otherTicketsHeld: held }), docs, workerId)
  if (missing) return fail(missing)
  for (const type of TICKET_TYPES) {
    if (answers[type].status !== "Yes, I have it") continue
    const problem = ticketEntryProblem(answers[type], today)
    if (problem) return fail(TICKET_LABELS[type] + ": " + problem)
  }
  for (const label of held.filter(isOtherLicence)) {
    const problem = ticketEntryProblem(input.otherDetails?.[label] || {}, today)
    if (problem) return fail(label + ": " + problem)
  }
  let changed = false
  for (const type of TICKET_TYPES) {
    const built = withWorkerEntry(worker.tickets[type], answers[type].status, answers[type], today)
    if (!built.ok) return fail(built.error)
    if (answers[type].status === "Yes, I have it") {
      if (built.changed) await clearPhotoSchedule(ctx, workerId, type)
    } else if (worker.tickets[type]?.status === "Yes, I have it" || built.changed) {
      await deleteLicencePhotos(ctx, workerId, type, workerId, "Removed because the worker no longer holds this card.")
    }
    if (built.changed) changed = true
    worker.tickets[type] = built.ticket
  }
  await syncOtherLicences(ctx, worker, held)
  for (const label of held.filter(isOtherLicence)) {
    const entry = input.otherDetails?.[label] || {}
    const previous = worker.licenceChecks?.[label]
    const number = (entry.number || "").trim()
    const expiry = entry.noExpiry ? null : entry.expiry || null
    const same = previous?.checkedAt && previous.number === number && (previous.expiry || null) === expiry
    worker.licenceChecks = {
      ...worker.licenceChecks,
      [label]: same
        ? previous
        : { number, expiry },
    }
    if (!same) changed = true
  }
  if (changed) {
    worker.ticketsVerified = allHeldChecked(worker)
    const note = "Ticket updated in the portal on " + sydneyToday(ctx.now) + ". Needs a new check."
    worker.notes = worker.notes ? worker.notes + "\n" + note : note
  }
  await persistWorker(ctx, worker)
  await audit(ctx, workerId, "ticket-update", workerId)
  return { ok: true as const }
}

export async function saveOtherLicences(ctx: Ctx, workerId: string, held: string[], details: Record<string, TicketEntry> = {}) {
  const worker = await ctx.store.workers.get(workerId)
  if (!worker) return fail("Log in again.")
  const next = held.map(String)
  if (next.some((item) => !(OTHER_TICKETS as readonly string[]).includes(item))) return fail("Choose tickets from the list.")
  const today = sydneyToday(ctx.now)
  const docs = await workerDocs(ctx, workerId)
  const missing = missingPhotoMessage(
    next.filter(isOtherLicence).map((label) => ({ key: label, label })),
    docs,
    workerId,
  )
  if (missing) return fail(missing)
  for (const label of next.filter(isOtherLicence)) {
    const problem = ticketEntryProblem(details[label] || {}, today)
    if (problem) return fail(label + ": " + problem)
  }
  const previousHeld = worker.otherTicketsHeld || []
  let changed =
    previousHeld.length !== next.length ||
    previousHeld.some((item) => !next.includes(item)) ||
    next.some((item) => !previousHeld.includes(item))
  await syncOtherLicences(ctx, worker, next)
  for (const label of next.filter(isOtherLicence)) {
    const entry = details[label] || {}
    const previous = worker.licenceChecks?.[label]
    const number = (entry.number || "").trim()
    const expiry = entry.noExpiry ? null : entry.expiry || null
    const same = Boolean(previous?.checkedAt) && previous?.number === number && (previous?.expiry || null) === expiry
    worker.licenceChecks = { ...worker.licenceChecks, [label]: same && previous ? previous : { number, expiry } }
    if (!same) changed = true
  }
  if (changed) worker.ticketsVerified = allHeldChecked(worker)
  await persistWorker(ctx, worker)
  await audit(ctx, workerId, "ticket-update", "other")
  return { ok: true as const }
}

export async function saveTicketPhoto(
  ctx: Ctx,
  workerId: string,
  input: { bytes: Buffer; licenceKey: string; side: PhotoSide },
) {
  if (!isPhotoLicenceKey(input.licenceKey)) return fail("Choose a ticket from the list.")
  if (input.side !== "front" && input.side !== "back") return fail("Choose the front or the back of the card.")
  if (input.bytes.length > TICKET_PHOTO_MAX_BYTES) {
    return fail("That photo is over 8 MB. Take it again a little further from the card.")
  }
  const sniffed = sniffFile(input.bytes)
  if (!sniffed || !(TICKET_PHOTO_TYPES as readonly string[]).includes(sniffed)) {
    return fail("Use a JPG, PNG or HEIC photo.")
  }
  const bytes = sniffed === "jpeg" ? stripJpegExif(input.bytes) : input.bytes
  const id = newId("doc")
  const contentType = contentTypeFor(sniffed)
  let url: string | null = null
  try {
    url = await storePrivateBlob(id, bytes, contentType)
  } catch {
    return fail("The private file store did not accept this photo. Try again, or call MS Workforce on " + MS_PHONE + ".")
  }
  await deleteLicencePhotos(ctx, workerId, input.licenceKey, workerId, "Replaced by a new " + input.side + " photo.", input.side)
  await ctx.store.blobs.save({
    id,
    contentType,
    base64: url ? "" : bytes.toString("base64"),
    url: url || undefined,
  })
  await ctx.store.documents.save({
    id,
    workerId,
    kind: "ticket",
    ticketType: isTicketType(input.licenceKey) ? input.licenceKey : undefined,
    licenceKey: input.licenceKey,
    side: input.side,
    contentType,
    bytes: bytes.length,
    createdAt: ctx.now.toISOString(),
  })
  const worker = await ctx.store.workers.get(workerId)
  if (worker) {
    await clearPhotoSchedule(ctx, workerId, input.licenceKey)
    clearLicenceCheck(worker, input.licenceKey)
    worker.ticketsVerified = false
    await persistWorker(ctx, worker)
  }
  await audit(ctx, workerId, "upload-ticket-photo", id, licenceLabel(input.licenceKey) + " " + input.side)
  return { ok: true as const, id }
}

function clearLicenceCheck(worker: Worker, key: string) {
  if (isTicketType(key)) {
    const status = worker.tickets[key]?.status || "No"
    worker.tickets[key] = freshTicket(status)
    return
  }
  if (!worker.licenceChecks) return
  delete worker.licenceChecks[key]
}

function allHeldChecked(worker: Worker): boolean {
  for (const type of TICKET_TYPES) {
    if (worker.tickets[type]?.status === "Yes, I have it" && !worker.tickets[type]?.checkedAt) return false
  }
  for (const label of worker.otherTicketsHeld || []) {
    if (!isOtherLicence(label)) continue
    if (!worker.licenceChecks?.[label]?.checkedAt) return false
  }
  return true
}

async function syncOtherLicences(ctx: Ctx, worker: Worker, held: string[]) {
  const previous = worker.otherTicketsHeld || []
  for (const label of previous) {
    if (held.includes(label)) continue
    await deleteLicencePhotos(ctx, worker.id, label, worker.id, "Removed because the worker no longer holds this card.")
    if (worker.licenceChecks) delete worker.licenceChecks[label]
  }
  worker.otherTicketsHeld = held
}

async function clearPhotoSchedule(ctx: Ctx, workerId: string, licenceKey: string) {
  const docs = activeTicketPhotos(await workerDocs(ctx, workerId), workerId, licenceKey)
  for (const doc of docs) {
    if (!doc.verifiedAt && !doc.deleteBy) continue
    doc.verifiedAt = undefined
    doc.deleteBy = undefined
    await ctx.store.documents.save(doc)
  }
}

async function deleteLicencePhotos(ctx: Ctx, workerId: string, licenceKey: string, actorId: string, detail: string, side?: PhotoSide) {
  const docs = activeTicketPhotos(await workerDocs(ctx, workerId), workerId, licenceKey).filter((doc) => !side || doc.side === side)
  for (const doc of docs) {
    doc.deletedAt = ctx.now.toISOString()
    await ctx.store.documents.save(doc)
    await forgetBlob(ctx, doc.id)
    await audit(ctx, actorId, "delete-ticket-photos", doc.id, licenceLabel(licenceKey) + " " + (doc.side || "photo") + ". " + detail)
  }
}

function rememberPhotoDeletion(worker: Worker, licenceKey: string | undefined, day: string) {
  if (!licenceKey) return
  if (isTicketType(licenceKey)) {
    const ticket = worker.tickets[licenceKey]
    if (ticket && !ticket.photosDeletedAt) ticket.photosDeletedAt = day
    return
  }
  worker.licenceChecks = worker.licenceChecks || {}
  const row: LicenceCheck = worker.licenceChecks[licenceKey] || {}
  if (!row.photosDeletedAt) row.photosDeletedAt = day
  worker.licenceChecks[licenceKey] = row
}

export async function submitInduction(
  ctx: Ctx,
  workerId: string,
  input: { answers: number[]; typedName?: string; signaturePng?: string },
) {
  const worker = await ctx.store.workers.get(workerId)
  if (!worker) return fail("Log in again.")
  if (!worker.onboardingSubmitted) return fail("Finish onboarding before the induction.")
  const result = scoreAnswers(input.answers)
  await ctx.store.attempts.save({
    id: newId("att"),
    workerId,
    at: ctx.now.toISOString(),
    score: result.score,
    critical: result.critical,
    pass: result.pass,
    version: INDUCTION_VERSION,
  })
  if (!result.pass) {
    await audit(ctx, workerId, "induction-fail", workerId, result.score + "/8")
    return { ok: true as const, pass: false as const, needsSignature: false as const, score: result.score, critical: result.critical }
  }
  if (!input.typedName?.trim() || !input.signaturePng) {
    return { ok: true as const, pass: true as const, needsSignature: true as const, score: result.score, critical: result.critical }
  }
  if (sensitiveMessage(input.typedName)) return fail(SENSITIVE_MESSAGE)
  const today = sydneyToday(ctx.now)
  worker.inductionPassed = today
  worker.inductionScore = result.score
  worker.inductionVersion = INDUCTION_VERSION
  await ctx.store.records.save({
    id: newId("ir"),
    workerId,
    workerName: worker.name,
    score: result.score,
    critical: result.critical,
    result: "Pass",
    version: INDUCTION_VERSION,
    typedName: input.typedName.trim(),
    signaturePng: input.signaturePng,
    date: today,
  })
  await persistWorker(ctx, worker)
  await audit(ctx, workerId, "induction-pass", workerId, result.score + "/8")
  return { ok: true as const, pass: true as const, needsSignature: false as const, score: result.score, critical: result.critical }
}

export async function listOffers(ctx: Ctx, workerId?: string) {
  const offers = await ctx.store.offers.all()
  for (const offer of offers) {
    if (offer.status === "Offered" && Date.parse(offer.expiresAt) < ctx.now.getTime()) {
      offer.status = "Expired"
      await ctx.store.offers.save(offer)
      await enqueue(ctx, "shiftOffers", offerNotionProperties(offer, "Worker"))
    }
  }
  return workerId ? offers.filter((offer) => offer.workerId === workerId) : offers
}

export async function respondToOffer(
  ctx: Ctx,
  input: { workerId: string; offerId: string; accept: boolean; reason?: string },
) {
  const offer = await ctx.store.offers.get(input.offerId)
  if (!offer || offer.workerId !== input.workerId) return fail("That offer is not on your list.")
  if (offer.status !== "Offered") return fail("This offer is already " + offer.status.toLowerCase() + ".")
  if (Date.parse(offer.expiresAt) < ctx.now.getTime()) {
    offer.status = "Expired"
    await ctx.store.offers.save(offer)
    return fail("This offer has expired. Call MS Workforce on " + MS_PHONE + " if you still want the shift.")
  }
  const worker = await ctx.store.workers.get(input.workerId)
  if (!worker) return fail("Log in again.")
  if (!input.accept) {
    if (input.reason && sensitiveMessage(input.reason)) return fail(SENSITIVE_MESSAGE)
    offer.status = "Declined"
    offer.declineReason = input.reason || ""
    offer.respondedAt = ctx.now.toISOString()
    await ctx.store.offers.save(offer)
    await enqueue(ctx, "shiftOffers", offerNotionProperties(offer, worker.name))
    await alertMav(ctx, worker.name + " declined " + offer.placementRef, offer.suburb + " on " + formatDate(offer.shiftDate))
    await audit(ctx, worker.id, "decline-offer", offer.id)
    return { ok: true as const, status: "Declined" as const }
  }
  const check = canAcceptShift({
    tickets: asTicketInputs(worker.tickets),
    jobDate: offer.shiftDate,
    required: offer.requiredTickets,
  })
  if (!check.ok) return check
  offer.status = "Accepted"
  offer.respondedAt = ctx.now.toISOString()
  await ctx.store.offers.save(offer)
  await enqueue(ctx, "shiftOffers", offerNotionProperties(offer, worker.name))
  await alertMav(
    ctx,
    worker.name + " accepted " + offer.placementRef,
    offer.roleName + " at " + offer.suburb + " on " + formatDate(offer.shiftDate) + ".",
  )
  await audit(ctx, worker.id, "accept-offer", offer.id)
  return { ok: true as const, status: "Accepted" as const }
}

export async function submitTimesheet(
  ctx: Ctx,
  input: {
    workerId: string
    offerId: string
    workDate: string
    start: string
    finish: string
    breakMinutes: number
    breakNote?: string
    tasks?: string[]
    taskNote?: string
    incident: boolean
    incidentNote?: string
    workerNote?: string
    workerConfirmed: boolean
    confirmUnusualHours?: boolean
    supervisorName: string
    supervisorRole: string
    supervisorConfirmed: boolean
    signaturePng: string
    ip?: string
    userAgent?: string
  },
) {
  const offer = await ctx.store.offers.get(input.offerId)
  if (!offer || offer.workerId !== input.workerId || offer.status !== "Accepted") {
    return fail("Choose an accepted shift first.")
  }
  if (offer.shiftDate !== input.workDate) return fail("Choose the shift for that day.")
  const today = sydneyToday(ctx.now)
  if (input.workDate > today) return fail("That date has not happened yet.")
  if (olderThanDays(input.workDate, today, 7)) return fail("Please call MS Workforce on " + MS_PHONE)
  const worker = await ctx.store.workers.get(input.workerId)
  if (!worker) return fail("Log in again.")
  if (!onQuarterHour(input.start) || !onQuarterHour(input.finish)) {
    return fail("Use 15-minute steps for start and finish.")
  }
  const startMin = timeMinutes(input.start)
  const finishMin = timeMinutes(input.finish)
  if (startMin < 5 * 60 || startMin > 20 * 60 || finishMin < 5 * 60 || finishMin > 20 * 60) {
    return fail("Start and finish need to be between 5:00 am and 8:00 pm.")
  }
  const breakMinutes = Number(input.breakMinutes)
  if (!Number.isInteger(breakMinutes) || breakMinutes < 0 || breakMinutes > 120) {
    return fail("Unpaid break needs to be between 0 and 120 minutes.")
  }
  const hours = paidHours(input.start, input.finish, breakMinutes)
  if (!hours.ok) return hours
  const warnings = hoursWarnings(hours.hours)
  if (warnings.some((warning) => warning.level === "confirm") && !input.confirmUnusualHours) {
    return fail(warnings.find((warning) => warning.level === "confirm")?.message || "Confirm the times.")
  }
  if (!input.workerConfirmed) return fail("Tick the box to confirm these are the hours you worked.")
  if (typeof input.incident !== "boolean") return fail("Say whether there was an incident today.")
  if (input.incident && !input.incidentNote?.trim()) return fail("Tell us what happened.")
  if (!input.supervisorConfirmed) return fail("The supervisor needs to tick the hours as correct.")
  const supervisorName = input.supervisorName.trim()
  if (!supervisorName) return fail("The supervisor needs to type their name.")
  if (!SUPERVISOR_ROLES.includes(input.supervisorRole as (typeof SUPERVISOR_ROLES)[number])) {
    return fail("Choose the supervisor's role.")
  }
  if (!input.signaturePng?.startsWith("data:image/") || input.signaturePng.length > 1_500_000) {
    return fail("The supervisor needs to sign on the screen.")
  }
  const tasks = (input.tasks || []).filter((task) => TIMESHEET_TASKS.includes(task as (typeof TIMESHEET_TASKS)[number]))
  if ((input.tasks || []).length !== tasks.length) return fail("Choose tasks from the list.")
  const workerNote = input.workerNote?.trim().slice(0, 300)
  const sensitive = texts([supervisorName, input.breakNote, input.taskNote, input.incidentNote, workerNote])
  if (sensitive) return fail(sensitive)
  const existing = (await ctx.store.timesheets.all()).find(
    (sheet) => sheet.workerId === input.workerId && sheet.placementRef === offer.placementRef && sheet.workDate === input.workDate,
  )
  if (existing && existing.status !== "Draft") {
    return fail("These hours are already signed. Something wrong? Call MS Workforce on " + MS_PHONE + ".")
  }
  const fortnight = payFortnight(ctx.now)
  const planned = (offer.timesheetSigner || "").trim().toLowerCase()
  const sheet: Timesheet = {
    id: existing?.id || newId("ts"),
    workerId: worker.id,
    offerId: offer.id,
    placementRef: offer.placementRef,
    workDate: input.workDate,
    start: input.start,
    finish: input.finish,
    breakMinutes,
    breakNote: input.breakNote?.trim() || undefined,
    totalHours: hours.hours,
    tasks,
    taskNote: input.taskNote?.trim() || undefined,
    incident: input.incident,
    incidentNote: input.incident ? input.incidentNote?.trim() : undefined,
    workerNote: workerNote || undefined,
    workerConfirmedAt: ctx.now.toISOString(),
    status: "Approved",
    supervisorName,
    supervisorRole: input.supervisorRole,
    plannedSigner: offer.timesheetSigner,
    signerMismatch: Boolean(planned) && planned !== supervisorName.toLowerCase(),
    signaturePng: input.signaturePng,
    signatureIp: input.ip?.slice(0, 80),
    signatureUserAgent: input.userAgent?.slice(0, 180),
    approvedAt: ctx.now.toISOString(),
    payFortnight: fortnight.label,
    payDay: fortnight.payDay,
    afterCutoff: fortnight.afterCutoff,
    corrected: false,
    source: "Portal",
    workerName: worker.name,
    siteName: offer.siteName,
    suburb: offer.suburb,
    confirmationSentAt: ctx.now.toISOString(),
  }
  await ctx.store.timesheets.save(sheet)
  await enqueue(ctx, "timesheets", timesheetNotionProperties(sheet))
  const body = [
    "Hours signed",
    "",
    worker.name,
    "Date: " + formatDate(sheet.workDate),
    "Start: " + sheet.start,
    "Finish: " + sheet.finish,
    "Unpaid break: " + sheet.breakMinutes + " minutes",
    "Paid hours: " + formatHours(sheet.totalHours),
    "",
    "Signed on site by " + sheet.supervisorName + (sheet.supervisorRole ? " (" + sheet.supervisorRole + ")" : "") + ".",
    "This signature is the approval.",
    "",
    "Pay is fortnightly, on Thursday.",
    "This fortnight: " + fortnight.label + ". Pay day: Thursday " + formatDate(fortnight.payDay) + ".",
  ].join("\n")
  if (worker.email) {
    await ctx.notify.email({ to: worker.email, subject: "Hours signed — " + formatDate(sheet.workDate), body })
  }
  await ctx.notify.email({ to: adminEmail(), subject: "Hours signed — " + worker.name, body })
  if (sheet.incident) {
    const alert = worker.name + " reported an incident on " + formatDate(sheet.workDate) + ". " + (sheet.incidentNote || "")
    await ctx.notify.sms(adminMobile(), alert)
    await ctx.notify.email({ to: adminEmail(), subject: "Incident — " + worker.name, body: alert })
  }
  await audit(ctx, worker.id, "timesheet-signed", sheet.id)
  return { ok: true as const, id: sheet.id, hours: hours.hours, warnings, status: sheet.status, afterCutoff: fortnight.afterCutoff, payDay: fortnight.payDay }
}

function timeMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number)
  return hour * 60 + minute
}

export async function correctTimesheet(
  ctx: Ctx,
  adminId: string,
  sheetId: string,
  patch: { start: string; finish: string; breakMinutes: number; note?: string },
) {
  const admin = await ctx.store.workers.get(adminId)
  if (!admin || admin.role !== "admin") return fail("Mav's login is required.")
  const sheet = await ctx.store.timesheets.get(sheetId)
  if (!sheet || sheet.status === "Draft") return fail("Only a signed timesheet can be corrected.")
  const hours = paidHours(patch.start, patch.finish, Number(patch.breakMinutes))
  if (!hours.ok) return hours
  const before = JSON.stringify({
    start: sheet.start,
    finish: sheet.finish,
    breakMinutes: sheet.breakMinutes,
    totalHours: sheet.totalHours,
    status: sheet.status,
  })
  sheet.start = patch.start
  sheet.finish = patch.finish
  sheet.breakMinutes = Number(patch.breakMinutes)
  sheet.totalHours = hours.hours
  sheet.status = "Approved"
  sheet.corrected = true
  await ctx.store.timesheets.save(sheet)
  await enqueue(ctx, "timesheets", timesheetNotionProperties(sheet))
  await audit(ctx, adminId, "timesheet-corrected", sheet.id, before + (patch.note ? " " + patch.note : ""))
  return { ok: true as const, id: sheet.id }
}

export async function queryTimesheet(ctx: Ctx, adminId: string, sheetId: string, note?: string) {
  const admin = await ctx.store.workers.get(adminId)
  if (!admin || admin.role !== "admin") return fail("Mav's login is required.")
  const sheet = await ctx.store.timesheets.get(sheetId)
  if (!sheet || sheet.status === "Draft") return fail("That timesheet is not signed.")
  const before = sheet.status
  sheet.status = "Queried"
  if (note?.trim()) sheet.workerNote = note.trim().slice(0, 300)
  await ctx.store.timesheets.save(sheet)
  await enqueue(ctx, "timesheets", timesheetNotionProperties(sheet))
  await audit(ctx, adminId, "timesheet-queried", sheet.id, before)
  return { ok: true as const }
}

export async function createOffers(
  ctx: Ctx,
  adminId: string,
  input: {
    placementRef: string
    suburb: string
    address?: string
    siteName?: string
    siteContact?: string
    sitePhone?: string
    siteEmail?: string
    shiftDate: string
    startTime: string
    expectedHours: number
    roleName: string
    rateToWorker: string
    requiredTickets: TicketType[]
    inductionMethod?: string
    inductionLink?: string
    signInMethod?: string
    highRisk?: string
    parking?: string
    bring?: string
    expiresHours?: number
    workerIds: string[] | "all"
  },
) {
  const admin = await ctx.store.workers.get(adminId)
  if (!admin || admin.role !== "admin") return fail("Mav's login is required.")
  if (texts([input.placementRef, input.suburb, input.address, input.highRisk, input.parking, input.bring])) {
    return fail(SENSITIVE_MESSAGE)
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.shiftDate)) return fail("Choose a shift date.")
  const workers = (await ctx.store.workers.all()).filter((worker) => worker.role === "worker")
  const chosen = input.workerIds === "all" ? workers.filter((worker) => worker.status === "Ready") : workers.filter((worker) => input.workerIds.includes(worker.id))
  if (!chosen.length) return fail("Choose at least one worker.")
  const skipped: string[] = []
  const created: string[] = []
  const hours = Math.min(Math.max(input.expiresHours || 2, 1), 72)
  for (const worker of chosen) {
    const check = canAcceptShift({
      tickets: asTicketInputs(worker.tickets),
      jobDate: input.shiftDate,
      required: input.requiredTickets,
    })
    if (!check.ok && check.code === "do-not-book") {
      skipped.push(worker.name)
      if (input.workerIds !== "all") return fail(worker.name + " is DO NOT BOOK. The offer was not sent.")
      continue
    }
    const offer: Offer = {
      id: newId("offer"),
      placementRef: input.placementRef.trim(),
      workerId: worker.id,
      suburb: input.suburb.trim(),
      address: input.address?.trim(),
      siteName: input.siteName?.trim(),
      siteContact: input.siteContact?.trim(),
      sitePhone: input.sitePhone ? toE164(input.sitePhone) || input.sitePhone : undefined,
      siteEmail: input.siteEmail?.trim(),
      shiftDate: input.shiftDate,
      startTime: input.startTime,
      expectedHours: Number(input.expectedHours) || 8,
      roleName: input.roleName.trim(),
      rateToWorker: input.rateToWorker.trim(),
      requiredTickets: Array.from(new Set<TicketType>(["whiteCard", ...input.requiredTickets])),
      inductionMethod: input.inductionMethod,
      inductionLink: input.inductionLink,
      signInMethod: input.signInMethod,
      highRisk: input.highRisk,
      parking: input.parking,
      bring: input.bring?.trim() || WHAT_TO_BRING,
      status: "Offered",
      expiresAt: new Date(ctx.now.getTime() + hours * 60 * 60 * 1000).toISOString(),
      sentAt: ctx.now.toISOString(),
      createdBy: admin.id,
    }
    await ctx.store.offers.save(offer)
    await enqueue(ctx, "shiftOffers", offerNotionProperties(offer, worker.name))
    await ctx.notify.sms(
      worker.mobile,
      "New shift offer: " + formatDate(offer.shiftDate) + ", " + offer.suburb + ", " + offer.startTime + ", " + offer.roleName + ". Log in to the MS Workforce portal to accept or decline.",
    )
    created.push(worker.name)
    await audit(ctx, admin.id, "send-offer", offer.id)
  }
  if (!created.length) return fail("Nobody could be offered this shift. Check the DO NOT BOOK list.")
  return { ok: true as const, created, skipped }
}

export async function markTicketChecked(
  ctx: Ctx,
  adminId: string,
  workerId: string,
  input: { licenceKey: string; number: string; expiry: string; noExpiry: boolean },
) {
  const admin = await ctx.store.workers.get(adminId)
  if (!admin || admin.role !== "admin") return fail("Mav's login is required.")
  const worker = await ctx.store.workers.get(workerId)
  if (!worker || worker.role === "admin") return fail("Worker not found.")
  if (!isPhotoLicenceKey(input.licenceKey)) return fail("Choose a ticket from the list.")
  const number = input.number.trim()
  const numberProblem = ticketNumberProblem(number)
  if (numberProblem) return fail(numberProblem)
  let expiry: string | null = null
  if (!input.noExpiry) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.expiry)) return fail("Enter the expiry date on the card, or tick no expiry date.")
    expiry = input.expiry
  }
  const held = isTicketType(input.licenceKey)
    ? worker.tickets[input.licenceKey]?.status === "Yes, I have it"
    : Boolean(worker.otherTicketsHeld?.includes(input.licenceKey))
  if (!held) return fail("The worker has not said they hold this card.")
  const docs = activeTicketPhotos(await workerDocs(ctx, workerId), workerId, input.licenceKey)
  const front = docs.find((doc) => doc.side === "front")
  const back = docs.find((doc) => doc.side === "back")
  const previous = isTicketType(input.licenceKey) ? worker.tickets[input.licenceKey] : worker.licenceChecks?.[input.licenceKey]
  if ((!front || !back) && !previous?.checkedAt) return fail("Both photos have to be uploaded before this can be marked checked.")
  const checkedAt = ctx.now.toISOString()
  const photosDeletedAt = front && back ? undefined : previous?.photosDeletedAt
  if (isTicketType(input.licenceKey)) {
    worker.tickets[input.licenceKey] = {
      ...worker.tickets[input.licenceKey],
      status: "Yes, I have it",
      number,
      expiry,
      checkedBy: admin.name,
      checkedAt,
      pendingCheck: false,
      photosDeletedAt,
    }
  } else {
    worker.licenceChecks = {
      ...worker.licenceChecks,
      [input.licenceKey]: { number, expiry, checkedBy: admin.name, checkedAt, photosDeletedAt },
    }
  }
  const deleteBy = new Date(ctx.now.getTime() + DOCUMENT_KEEP_MS).toISOString()
  for (const doc of [front, back]) {
    if (!doc) continue
    doc.verifiedAt = checkedAt
    doc.deleteBy = deleteBy
    await ctx.store.documents.save(doc)
  }
  if (allHeldChecked(worker)) {
    worker.ticketsVerified = true
    worker.verifiedBy = admin.name
    worker.verifiedOn = sydneyToday(ctx.now)
    if (!worker.verificationMethod) worker.verificationMethod = "Photo in portal"
  }
  await persistWorker(ctx, worker)
  await audit(
    ctx,
    adminId,
    "mark-ticket-checked",
    workerId,
    licenceLabel(input.licenceKey) + " checked by " + admin.name + ". Expiry " + (expiry || "none") + ".",
  )
  return { ok: true as const }
}

export async function flagTicketMismatch(ctx: Ctx, adminId: string, workerId: string, licenceKey: string) {
  const admin = await ctx.store.workers.get(adminId)
  if (!admin || admin.role !== "admin") return fail("Mav's login is required.")
  const worker = await ctx.store.workers.get(workerId)
  if (!worker || worker.role === "admin") return fail("Worker not found.")
  if (!isPhotoLicenceKey(licenceKey)) return fail("Choose a ticket from the list.")
  if (isTicketType(licenceKey)) {
    const current = worker.tickets[licenceKey]
    worker.tickets[licenceKey] = {
      ...current,
      status: current?.status || "Yes, I have it",
      checkedBy: undefined,
      checkedAt: undefined,
      pendingCheck: true,
    }
  } else if (worker.licenceChecks?.[licenceKey]) {
    worker.licenceChecks[licenceKey] = { ...worker.licenceChecks[licenceKey], checkedBy: undefined, checkedAt: undefined }
  }
  worker.ticketsVerified = allHeldChecked(worker)
  await persistWorker(ctx, worker)
  await audit(ctx, adminId, "ticket-mismatch", workerId, licenceLabel(licenceKey) + " does not match the photo.")
  return { ok: true as const }
}

export async function verifyWorker(
  ctx: Ctx,
  adminId: string,
  workerId: string,
  patch: {
    verificationMethod?: string
    verifiedOn?: string
    verifiedBy?: string
    ticketsVerified?: boolean
    vevoResult?: string
    vevoCheckedOn?: string
    status?: Worker["status"]
    rightToWork?: "Yes" | "No"
  },
) {
  const admin = await ctx.store.workers.get(adminId)
  if (!admin || admin.role !== "admin") return fail("Mav's login is required.")
  const worker = await ctx.store.workers.get(workerId)
  if (!worker || worker.role === "admin") return fail("Worker not found.")
  if (patch.verificationMethod) {
    if (!VERIFICATION_METHODS.includes(patch.verificationMethod as never)) return fail("Choose a verification method from the list.")
    worker.verificationMethod = patch.verificationMethod
  }
  if (patch.verifiedOn) worker.verifiedOn = patch.verifiedOn
  if (patch.verifiedBy) worker.verifiedBy = patch.verifiedBy
  if (typeof patch.ticketsVerified === "boolean") worker.ticketsVerified = patch.ticketsVerified
  if (patch.rightToWork) worker.rightToWork = patch.rightToWork
  if (patch.status) worker.status = patch.status
  if (patch.vevoResult) {
    if (!VEVO_RESULTS.includes(patch.vevoResult as never)) return fail("Choose a VEVO result from the list.")
    worker.vevoResult = patch.vevoResult
    worker.vevoCheckedOn = patch.vevoCheckedOn || sydneyToday(ctx.now)
    worker.passport = null
    if (patch.vevoResult === "No work rights") worker.rightToWork = "No"
    else worker.rightToWork = "Yes"
  }
  await persistWorker(ctx, worker)
  await audit(ctx, adminId, "verify-worker", workerId)
  return { ok: true as const }
}

export async function revealPassport(ctx: Ctx, adminId: string, workerId: string) {
  const admin = await ctx.store.workers.get(adminId)
  if (!admin || admin.role !== "admin") return fail("Mav's login is required.")
  const worker = await ctx.store.workers.get(workerId)
  if (!worker?.passport) return fail("No passport number is stored.")
  await audit(ctx, adminId, "view-passport", workerId)
  return {
    ok: true as const,
    number: decryptString(worker.passport.ciphertext),
    country: worker.passport.country,
  }
}

export async function deleteWorkerImages(ctx: Ctx, adminId: string, workerId: string) {
  const admin = await ctx.store.workers.get(adminId)
  if (!admin || admin.role !== "admin") return fail("Mav's login is required.")
  const worker = await ctx.store.workers.get(workerId)
  if (!worker) return fail("Worker not found.")
  const docs = (await ctx.store.documents.all()).filter((doc) => doc.workerId === workerId && !doc.deletedAt)
  const day = sydneyToday(ctx.now)
  for (const doc of docs) {
    doc.deletedAt = ctx.now.toISOString()
    await ctx.store.documents.save(doc)
    await forgetBlob(ctx, doc.id)
    if (doc.kind === "ticket") {
      rememberPhotoDeletion(worker, doc.licenceKey, day)
      await audit(ctx, adminId, "delete-ticket-photos", doc.id, "Deleted by admin before the 7 days. The number, expiry and check record are kept.")
    } else {
      await audit(ctx, adminId, "delete-document", doc.id)
    }
  }
  worker.imagesDeletedOn = day
  await persistWorker(ctx, worker)
  return { ok: true as const, removed: docs.length }
}

export async function revokeSessions(ctx: Ctx, adminId: string, workerId: string) {
  const admin = await ctx.store.workers.get(adminId)
  if (!admin || admin.role !== "admin") return fail("Mav's login is required.")
  const sessions = (await ctx.store.sessions.all()).filter((session) => session.workerId === workerId)
  for (const session of sessions) await ctx.store.sessions.remove(session.id)
  await audit(ctx, adminId, "revoke-sessions", workerId)
  return { ok: true as const, removed: sessions.length }
}

export async function purgeDocuments(ctx: Ctx) {
  let removed = 0
  const docs = await ctx.store.documents.all()
  const touched = new Set<string>()
  const day = sydneyToday(ctx.now)
  for (const doc of docs) {
    if (doc.deletedAt || !doc.verifiedAt) continue
    if (ctx.now.getTime() - Date.parse(doc.verifiedAt) < DOCUMENT_KEEP_MS) continue
    doc.deletedAt = ctx.now.toISOString()
    await ctx.store.documents.save(doc)
    await forgetBlob(ctx, doc.id)
    removed += 1
    touched.add(doc.workerId)
    const label = doc.licenceKey ? licenceLabel(doc.licenceKey) : "stored file"
    const side = doc.side ? doc.side + " " : ""
    await audit(
      ctx,
      "cron",
      "delete-ticket-photos",
      doc.id,
      "Deleted the " + side + "photo of " + label + " 7 days after it was marked checked. The number, expiry and check record are kept.",
    )
  }
  for (const workerId of Array.from(touched)) {
    const worker = await ctx.store.workers.get(workerId)
    if (!worker) continue
    const remaining = await ctx.store.documents.all()
    const seen = new Set<string>()
    for (const doc of docs) {
      if (doc.workerId !== workerId || doc.kind !== "ticket" || !doc.licenceKey || !doc.deletedAt) continue
      if (seen.has(doc.licenceKey)) continue
      seen.add(doc.licenceKey)
      const stillThere = remaining.some(
        (item) => item.workerId === workerId && !item.deletedAt && item.kind === "ticket" && item.licenceKey === doc.licenceKey,
      )
      if (!stillThere) rememberPhotoDeletion(worker, doc.licenceKey, day)
    }
    const rest = (await ctx.store.documents.all()).filter((item) => item.workerId === workerId && !item.deletedAt)
    if (!rest.length && !worker.imagesDeletedOn) worker.imagesDeletedOn = day
    await persistWorker(ctx, worker)
  }
  return { ok: true as const, removed }
}

export async function wipePassports(ctx: Ctx) {
  let wiped = 0
  for (const worker of await ctx.store.workers.all()) {
    if (!worker.passport) continue
    if (ctx.now.getTime() - Date.parse(worker.passport.collectedAt) < PASSPORT_TTL_MS) continue
    worker.passport = null
    await persistWorker(ctx, worker)
    wiped += 1
  }
  return { ok: true as const, wiped }
}

export async function runReminders(ctx: Ctx) {
  const today = sydneyToday(ctx.now)
  const parts = sydneyParts(ctx.now)
  let sent = 0
  const offers = await ctx.store.offers.all()
  const sheets = await ctx.store.timesheets.all()
  for (const worker of await ctx.store.workers.all()) {
    if (worker.role !== "worker") continue
    const tickets = asTicketInputs(worker.tickets)
    for (const ticket of tickets) {
      if (!ticket.expiry) continue
      const days = daysBetween(today, ticket.expiry)
      const stage = dueReminderStage(days, warningWindowDays(ticket.type), [])
      if (!stage) continue
      const id = worker.id + ":" + ticket.type + ":" + ticket.expiry + ":" + stage
      if (await ctx.store.reminders.get(id)) continue
      const label = TICKET_LABELS[ticket.type]
      const body =
        stage === "0"
          ? label + " expires today. Upload the new card in the MS Workforce portal."
          : label + " expires in " + days + " days. Renew it before you are booked."
      await ctx.notify.sms(worker.mobile, body)
      if (worker.email) await ctx.notify.email({ to: worker.email, subject: label + " expiry", body })
      await ctx.store.reminders.save({ id, workerId: worker.id, ticket: ticket.type, kind: stage, expiry: ticket.expiry, sentAt: ctx.now.toISOString() })
      sent += 1
    }
    for (const extra of heldLicenceExpiries(worker)) {
      if (!extra.expiry) continue
      const days = daysBetween(today, extra.expiry)
      const stage = dueReminderStage(days, warningWindowDays("other"), [])
      if (!stage) continue
      const id = worker.id + ":licence:" + extra.label + ":" + extra.expiry + ":" + stage
      if (await ctx.store.reminders.get(id)) continue
      const body =
        stage === "0"
          ? extra.label + " expires today. Upload the new card in the MS Workforce portal."
          : extra.label + " expires in " + days + " days. Renew it before you are booked."
      await ctx.notify.sms(worker.mobile, body)
      if (worker.email) await ctx.notify.email({ to: worker.email, subject: extra.label + " expiry", body })
      await ctx.store.reminders.save({ id, workerId: worker.id, ticket: extra.label, kind: stage, expiry: extra.expiry, sentAt: ctx.now.toISOString() })
      sent += 1
    }
    const shiftToday = offers.find((offer) => offer.workerId === worker.id && offer.status === "Accepted" && offer.shiftDate === today && !offer.remindersOff)
    const signedToday = sheets.some((sheet) => sheet.workerId === worker.id && sheet.workDate === today && sheet.status === "Approved")
    const reminder = timesheetReminder({
      now: ctx.now,
      hasShiftToday: Boolean(shiftToday),
      signedToday,
      remindersOff: false,
    })
    if (reminder) {
      const id = worker.id + ":timesheet:" + today + ":" + reminder
      if (!(await ctx.store.reminders.get(id))) {
        const body = reminder === "cutoff" ? "Cut-off is 6 pm today" : "Log today's hours before you leave site"
        await ctx.notify.sms(worker.mobile, body)
        await ctx.store.reminders.save({ id, workerId: worker.id, ticket: "timesheet", kind: reminder, expiry: today, sentAt: ctx.now.toISOString() })
        sent += 1
      }
    }
  }
  if (parts.weekday.startsWith("Thu")) {
    const closed = fortnightContaining(addDays(today, -1))
    const signed = sheets.filter((sheet) => sheet.status === "Approved" && sheet.payFortnight === closed.label)
    const bySite = new Map<string, typeof signed>()
    for (const sheet of signed) {
      const offer = offers.find((item) => item.id === sheet.offerId)
      if (!offer?.siteEmail) continue
      const list = bySite.get(offer.siteEmail) || []
      list.push(sheet)
      bySite.set(offer.siteEmail, list)
    }
    for (const [email, list] of Array.from(bySite.entries())) {
      const id = "summary:" + closed.label + ":" + email
      if (await ctx.store.reminders.get(id)) continue
      const lines = list.map(
        (sheet) => sheet.workerName + " · " + sheet.workDate + " · " + formatHours(sheet.totalHours) + " hours · signed by " + (sheet.supervisorName || "supervisor"),
      )
      await ctx.notify.email({
        to: email,
        subject: "Hours for " + closed.label,
        body: ["MS Workforce hours for " + closed.label + ".", "", ...lines, "", "Reply within 2 business days if anything is wrong."].join("\n"),
      })
      await ctx.store.reminders.save({ id, workerId: "site", ticket: "timesheet-summary", kind: "thursday", expiry: closed.end, sentAt: ctx.now.toISOString() })
    }
  }
  if (isMondayInSydney(ctx.now)) {
    const lines: string[] = []
    for (const worker of await ctx.store.workers.all()) {
      if (worker.role !== "worker") continue
      const assessment = assessTickets(asTicketInputs(worker.tickets), today)
      if (assessment.badge === "ok") continue
      lines.push(worker.name + ": " + assessment.label + " — " + assessment.reasons.join("; "))
    }
    if (lines.length) {
      await ctx.notify.email({
        to: adminEmail(),
        subject: "Weekly ticket check",
        body: "Workers to check:\n\n" + lines.join("\n"),
      })
    }
  }
  return { ok: true as const, sent }
}

function flatProperties(payload: Record<string, unknown>) {
  const nested = payload.properties
  if (nested && typeof nested === "object" && !Array.isArray(nested)) return nested as Record<string, unknown>
  return payload
}

async function forgetBlob(ctx: Ctx, id: string) {
  const blob = await ctx.store.blobs.get(id)
  if (blob?.url) await deletePrivateBlob(blob.url)
  await ctx.store.blobs.remove(id)
}

export async function processOutbox(ctx: Ctx, fetchImpl?: typeof fetch) {
  if (ctx.mode === "mock") {
    const pending = (await ctx.store.outbox.all()).filter((item) => item.status === "pending")
    for (const item of pending) {
      item.status = "skipped-mock"
      await ctx.store.outbox.save(item)
    }
    void fetchImpl
    return { ok: true as const, sent: 0 }
  }
  const { notionRequest } = await import("@/lib/portal/notion/client")
  let sent = 0
  const due = (await ctx.store.outbox.all()).filter(
    (item) => item.status === "pending" && Date.parse(item.nextAttemptAt) <= ctx.now.getTime(),
  )
  for (const item of due.slice(0, 20)) {
    try {
      const database = databaseId(item.kind)
      if (!database) throw new Error("Notion database id is not set for " + item.kind)
      const properties = flatProperties(item.payload)
      const formatted = toNotionProperties(properties)
      const match = notionMatch(item.kind, item.payload, properties)
      const existing = match ? await findNotionPage(database, match, fetchImpl) : null
      const response = existing
        ? await notionRequest("/pages/" + existing, {
            method: "PATCH",
            body: JSON.stringify({ properties: formatted }),
            fetchImpl,
          })
        : await notionRequest("/pages", {
            method: "POST",
            body: JSON.stringify({ parent: { database_id: database }, properties: formatted }),
            fetchImpl,
          })
      if (!response.ok) throw new Error("Notion returned " + response.status)
      item.status = "sent"
      sent += 1
    } catch (error) {
      item.attempts += 1
      item.lastError = error instanceof Error ? error.message : "Notion write failed"
      item.nextAttemptAt = new Date(ctx.now.getTime() + Math.min(item.attempts, 6) * 60 * 1000).toISOString()
      if (item.attempts >= 8) item.status = "failed"
    }
    await ctx.store.outbox.save(item)
  }
  return { ok: true as const, sent }
}

function notionMatch(kind: string, payload: Record<string, unknown>, properties: Record<string, unknown>) {
  if (kind === "workers" && typeof payload.mobile === "string") {
    return { property: "Mobile", type: "phone_number" as const, value: payload.mobile }
  }
  if (kind === "shiftOffers" && typeof properties.Offer === "string") {
    return { property: "Offer", type: "title" as const, value: properties.Offer }
  }
  if (kind === "timesheets" && typeof properties.Entry === "string") {
    return { property: "Entry", type: "title" as const, value: properties.Entry }
  }
  return null
}

async function findNotionPage(
  database: string,
  match: { property: string; type: "phone_number" | "title"; value: string },
  fetchImpl?: typeof fetch,
) {
  const { notionRequest } = await import("@/lib/portal/notion/client")
  const response = await notionRequest("/databases/" + database + "/query", {
    method: "POST",
    body: JSON.stringify({
      page_size: 1,
      filter: { property: match.property, [match.type]: { equals: match.value } },
    }),
    fetchImpl,
  })
  if (!response.ok) throw new Error("Notion lookup returned " + response.status)
  const body = (await response.json()) as { results?: { id: string }[] }
  return body.results?.[0]?.id || null
}

function databaseId(kind: string) {
  if (kind === "workers") return process.env.NOTION_WORKERS_DB
  if (kind === "shiftOffers") return process.env.NOTION_SHIFT_OFFERS_DB
  if (kind === "timesheets") return process.env.NOTION_TIMESHEETS_DB
  if (kind === "induction") return process.env.NOTION_INDUCTION_DB
  return undefined
}

export function complianceFor(worker: Worker, checkDate: string) {
  return foldLicenceExpiries(assessTickets(asTicketInputs(worker.tickets), checkDate), heldLicenceExpiries(worker), checkDate)
}

export function nextExpiryFor(worker: Worker) {
  const dates: string[] = []
  const first = earliestExpiry(asTicketInputs(worker.tickets), worker.visaExpiry || null)
  if (first) dates.push(first)
  for (const extra of heldLicenceExpiries(worker)) {
    if (extra.expiry) dates.push(extra.expiry)
  }
  dates.sort()
  return dates[0] || null
}

export { addDays }
