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
  warningWindowDays,
} from "@/lib/portal/compliance"
import { decryptString, encryptString } from "@/lib/portal/crypto"
import { addDays, daysBetween, formatDate, isMondayInSydney, sydneyToday } from "@/lib/portal/dates"
import { deletePrivateBlob, storePrivateBlob } from "@/lib/portal/blob"
import { contentTypeFor, sniffFile, stripJpegExif } from "@/lib/portal/files"
import { hoursWarnings, paidHours } from "@/lib/portal/hours"
import { randomInt } from "crypto"
import { newId, sha256 } from "@/lib/portal/id"
import { INDUCTION_VERSION, scoreAnswers } from "@/lib/portal/induction"
import { offerNotionProperties, timesheetNotionProperties, toNotionProperties, workerNotionProperties } from "@/lib/portal/notion/map"
import { toE164 } from "@/lib/portal/phone"
import { SENSITIVE_MESSAGE, sensitiveMessage } from "@/lib/portal/privacy"
import type { Notify } from "@/lib/portal/notify"
import type { Store } from "@/lib/portal/store"
import {
  DRIVER_CLASSES,
  HELD_CHOICES,
  ROLES,
  TICKET_LABELS,
  VEVO_RESULTS,
  VERIFICATION_METHODS,
  type Offer,
  type Session,
  type Ticket,
  type TicketType,
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

export async function requestOtp(ctx: Ctx, input: { mobile: string; ip: string }) {
  const mobile = toE164(input.mobile)
  if (!mobile) return fail("Enter an Australian mobile, like 0400 000 000.")
  const worker = await findWorkerByMobile(ctx, mobile)
  if (!worker) return fail("That mobile is not on file. Apply for work first.", "unknown")
  if (worker.status === "Inactive") return fail("This account is inactive. Call Mav.")
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
  await ctx.notify.sms(mobile, "Your MS Workforce code is " + code + ". It expires in 10 minutes.", "Login code sent")
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
  if (!worker || worker.status === "Inactive") return fail("This account is inactive. Call Mav.")
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

export async function requestMagicLink(ctx: Ctx, input: { email: string; origin: string }) {
  const email = input.email.trim().toLowerCase()
  const worker = (await ctx.store.workers.all()).find((item) => item.email?.toLowerCase() === email)
  if (!worker) return fail("That email is not on file. Try your mobile instead.", "unknown")
  if (worker.status === "Inactive") return fail("This account is inactive. Call Mav.")
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
  if (!worker || worker.status === "Inactive") return fail("This account is inactive. Call Mav.")
  if (worker.role === "admin") return { ok: true as const, needsTotp: true as const, workerId: worker.id }
  const session = await openSession(ctx, worker)
  return { ok: true as const, needsTotp: false as const, session }
}

const applySchema = z.object({
  name: z.string().trim().min(2).max(80),
  mobile: z.string(),
  email: z.string().trim().max(120).optional(),
  suburb: z.string().trim().min(2).max(80),
  roles: z.array(z.enum(ROLES)).min(1),
  experience: z.string().trim().max(1000).optional(),
  whatsappOk: z.boolean(),
  privacyConsent: z.literal(true),
  tickets: z.object({
    whiteCard: z.enum(HELD_CHOICES),
    heights: z.enum(HELD_CHOICES),
    asbestosA: z.enum(HELD_CHOICES),
    asbestosB: z.enum(HELD_CHOICES),
    confinedSpace: z.enum(HELD_CHOICES),
    firstAid: z.enum(HELD_CHOICES),
    driverLicence: z.enum(DRIVER_CLASSES),
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
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return fail("That email does not look right.")
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
      whiteCard: { status: "Not held" },
      heights: { status: "Not held" },
      asbestosA: { status: "Not held" },
      asbestosB: { status: "Not held" },
      confinedSpace: { status: "Not held" },
      firstAid: { status: "Not held" },
      driverLicence: { status: "Not held" },
      other: { status: "Not held" },
    },
    ppe: [],
    createdAt: nowIso,
    updatedAt: nowIso,
  }
  worker.name = data.name
  worker.mobile = mobile
  worker.email = data.email || worker.email
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
    stringOf(patch.visaConditions),
    stringOf(patch.visaSubclass),
    stringOf(patch.typedName),
  ])
  if (sensitive) return fail(SENSITIVE_MESSAGE)
  if (typeof patch.dob === "string") worker.dob = patch.dob
  if (typeof patch.address === "string") worker.address = patch.address
  if (typeof patch.emergencyContact === "string") worker.emergencyContact = patch.emergencyContact
  if (typeof patch.emergencyPhone === "string") worker.emergencyPhone = toE164(patch.emergencyPhone) || patch.emergencyPhone
  if (typeof patch.rtw === "string") {
    worker.rtw = patch.rtw
    if (patch.rtw === "Citizen - passport" || patch.rtw === "Permanent resident") worker.rightToWork = "Yes"
  }
  if (typeof patch.vevoConsent === "boolean") worker.vevoConsent = patch.vevoConsent
  if (typeof patch.visaSubclass === "string") worker.visaSubclass = patch.visaSubclass
  if (typeof patch.visaConditions === "string") worker.visaConditions = patch.visaConditions
  if (typeof patch.visaExpiry === "string") worker.visaExpiry = patch.visaExpiry
  if (typeof patch.passportNumber === "string" && patch.passportNumber.trim()) {
    worker.passport = {
      ciphertext: encryptString(patch.passportNumber.trim()),
      country: stringOf(patch.passportCountry) || "",
      collectedAt: ctx.now.toISOString(),
    }
  }
  if (Array.isArray(patch.ppe)) worker.ppe = patch.ppe.map(String)
  if (typeof patch.transport === "string") worker.transport = patch.transport
  if (typeof patch.fitness === "string") worker.fitness = patch.fitness
  if (typeof patch.healthConsent === "boolean") worker.healthConsent = patch.healthConsent
  if (typeof patch.policiesAck === "boolean") worker.policiesAck = patch.policiesAck
  if (typeof patch.contractReceived === "string") worker.contractReceived = patch.contractReceived
  if (typeof patch.contractAccepted === "boolean") worker.contractAccepted = patch.contractAccepted
  if (typeof patch.privacyConsent === "boolean") worker.privacyConsent = patch.privacyConsent
  if (typeof patch.signaturePng === "string") worker.signaturePng = patch.signaturePng
  if (worker.status === "Applicant") worker.status = "Onboarding"
  if (patch.finish === true) {
    if (!worker.signaturePng || !stringOf(patch.typedName)) return fail("Type your name and sign to finish.")
    if (!worker.policiesAck || !worker.privacyConsent || !worker.healthConsent) {
      return fail("Tick the policy, privacy and health boxes to finish.")
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

function stringOf(value: unknown) {
  return typeof value === "string" ? value : ""
}

export async function saveTicket(ctx: Ctx, workerId: string, type: TicketType, ticket: Ticket) {
  const worker = await ctx.store.workers.get(workerId)
  if (!worker) return fail("Log in again.")
  const allowed = type === "driverLicence" ? DRIVER_CLASSES : HELD_CHOICES
  if (!allowed.includes(ticket.status as never)) return fail("Choose one of the listed options.")
  if (texts([ticket.number, ticket.note])) return fail(SENSITIVE_MESSAGE)
  worker.tickets[type] = {
    ...worker.tickets[type],
    ...ticket,
    pendingCheck: ticket.status !== "Not held",
  }
  worker.ticketsVerified = false
  const note = "Ticket updated in the portal on " + sydneyToday(ctx.now) + ". Needs a new check."
  worker.notes = worker.notes ? worker.notes + "\n" + note : note
  await persistWorker(ctx, worker)
  await audit(ctx, workerId, "ticket-update", type)
  return { ok: true as const }
}

export async function saveUpload(
  ctx: Ctx,
  workerId: string,
  input: { bytes: Buffer; kind: "ticket" | "id"; ticketType?: TicketType },
) {
  if (input.bytes.length > 10 * 1024 * 1024) return fail("Files need to be 10 MB or smaller.")
  const sniffed = sniffFile(input.bytes)
  if (!sniffed) return fail("Use a JPG, PNG, WEBP, PDF or HEIC photo.")
  const bytes = sniffed === "jpeg" ? stripJpegExif(input.bytes) : input.bytes
  const id = newId("doc")
  const contentType = contentTypeFor(sniffed)
  let url: string | null = null
  try {
    url = await storePrivateBlob(id, bytes, contentType)
  } catch {
    return fail("The private file store did not accept this photo. Try again, or ask Mav.")
  }
  await ctx.store.blobs.save({
    id,
    contentType,
    base64: url ? "" : bytes.toString("base64"),
    url: url || undefined,
  })
  await ctx.store.documents.save({
    id,
    workerId,
    kind: input.kind,
    ticketType: input.ticketType,
    contentType,
    bytes: bytes.length,
    createdAt: ctx.now.toISOString(),
  })
  if (input.kind === "ticket") {
    const worker = await ctx.store.workers.get(workerId)
    if (worker) {
      worker.ticketsVerified = false
      await persistWorker(ctx, worker)
    }
  }
  await audit(ctx, workerId, "upload-document", id)
  return { ok: true as const, id }
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
    return fail("This offer has expired. Call Mav if you still want the shift.")
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
    supervisorName?: string
    supervisorRole?: string
    signaturePng?: string
  },
) {
  const offer = await ctx.store.offers.get(input.offerId)
  if (!offer || offer.workerId !== input.workerId || offer.status !== "Accepted") {
    return fail("Choose an accepted shift first.")
  }
  const worker = await ctx.store.workers.get(input.workerId)
  if (!worker) return fail("Log in again.")
  const hours = paidHours(input.start, input.finish, Number(input.breakMinutes))
  if (!hours.ok) return hours
  const sensitive = texts([input.supervisorName, input.supervisorRole])
  if (sensitive) return fail(sensitive)
  const existing = (await ctx.store.timesheets.all()).find(
    (sheet) => sheet.workerId === input.workerId && sheet.placementRef === offer.placementRef && sheet.workDate === input.workDate,
  )
  if (existing?.status === "Approved") return fail("These hours are already signed. Call Mav if something is wrong.")
  const warnings = hoursWarnings(hours.hours)
  const signed = Boolean(input.signaturePng && input.supervisorName?.trim())
  if (input.signaturePng && !input.supervisorName?.trim()) return fail("The supervisor needs to type their name.")
  const sheet = existing || {
    id: newId("ts"),
    workerId: worker.id,
    offerId: offer.id,
    placementRef: offer.placementRef,
    workDate: input.workDate,
    start: input.start,
    finish: input.finish,
    breakMinutes: Number(input.breakMinutes),
    totalHours: hours.hours,
    status: "Draft" as const,
    workerName: worker.name,
  }
  sheet.start = input.start
  sheet.finish = input.finish
  sheet.breakMinutes = Number(input.breakMinutes)
  sheet.totalHours = hours.hours
  sheet.offerId = offer.id
  if (signed) {
    sheet.status = "Approved"
    sheet.supervisorName = input.supervisorName?.trim()
    sheet.supervisorRole = input.supervisorRole?.trim() || "Site supervisor"
    sheet.signaturePng = input.signaturePng
    sheet.approvedAt = ctx.now.toISOString()
    sheet.confirmationSentAt = ctx.now.toISOString()
  }
  await ctx.store.timesheets.save(sheet)
  if (signed) {
    await enqueue(ctx, "timesheets", timesheetNotionProperties(sheet))
    const body = [
      "Hours signed",
      "",
      worker.name,
      "Date: " + formatDate(sheet.workDate),
      "Start: " + sheet.start,
      "Finish: " + sheet.finish,
      "Unpaid break: " + sheet.breakMinutes + " minutes",
      "Paid hours: " + sheet.totalHours,
      "",
      "Signed on site by " + sheet.supervisorName + (sheet.supervisorRole ? " (" + sheet.supervisorRole + ")" : "") + ".",
      "This signature is the approval.",
      "",
      "Pay is fortnightly, on Thursday.",
    ].join("\n")
    if (worker.email) {
      await ctx.notify.email({ to: worker.email, subject: "Hours signed — " + formatDate(sheet.workDate), body })
    }
    await ctx.notify.email({ to: adminEmail(), subject: "Hours signed — " + worker.name, body })
    if (offer.siteEmail) {
      await ctx.notify.email({ to: offer.siteEmail, subject: "Hours signed — " + worker.name, body })
    }
    await audit(ctx, worker.id, "timesheet-signed", sheet.id)
  }
  return { ok: true as const, id: sheet.id, hours: hours.hours, warnings, status: sheet.status }
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
    ppe?: string
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
  if (texts([input.placementRef, input.suburb, input.address, input.ppe, input.highRisk, input.parking, input.bring])) {
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
      ppe: input.ppe,
      inductionMethod: input.inductionMethod,
      inductionLink: input.inductionLink,
      signInMethod: input.signInMethod,
      highRisk: input.highRisk,
      parking: input.parking,
      bring: input.bring,
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
  if (patch.ticketsVerified) {
    const docs = await ctx.store.documents.all()
    for (const doc of docs.filter((item) => item.workerId === workerId && !item.deletedAt)) {
      doc.verifiedAt = ctx.now.toISOString()
      doc.deleteBy = new Date(ctx.now.getTime() + DOCUMENT_KEEP_MS).toISOString()
      await ctx.store.documents.save(doc)
    }
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
  for (const doc of docs) {
    doc.deletedAt = ctx.now.toISOString()
    await ctx.store.documents.save(doc)
    await forgetBlob(ctx, doc.id)
    await audit(ctx, adminId, "delete-document", doc.id)
  }
  worker.imagesDeletedOn = sydneyToday(ctx.now)
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
  for (const doc of docs) {
    if (doc.deletedAt || !doc.verifiedAt) continue
    if (ctx.now.getTime() - Date.parse(doc.verifiedAt) < DOCUMENT_KEEP_MS) continue
    doc.deletedAt = ctx.now.toISOString()
    await ctx.store.documents.save(doc)
    await forgetBlob(ctx, doc.id)
    removed += 1
    const rest = (await ctx.store.documents.all()).filter((item) => item.workerId === doc.workerId && !item.deletedAt)
    if (!rest.length) {
      const worker = await ctx.store.workers.get(doc.workerId)
      if (worker && !worker.imagesDeletedOn) {
        worker.imagesDeletedOn = sydneyToday(ctx.now)
        await persistWorker(ctx, worker)
      }
    }
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
  let sent = 0
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
  return assessTickets(asTicketInputs(worker.tickets), checkDate)
}

export function nextExpiryFor(worker: Worker) {
  return earliestExpiry(asTicketInputs(worker.tickets), worker.visaExpiry || null)
}

export { addDays }
