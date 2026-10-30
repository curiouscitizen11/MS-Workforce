"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { isMock, portalMode, siteOrigin } from "@/lib/portal/config"
import { createNotify } from "@/lib/portal/notify"
import {
  confirmAdminTotp,
  createOffers,
  deleteWorkerImages,
  requestMagicLink,
  finishJoin,
  makeWorkerInvite,
  prepareJoin,
  requestOtp,
  resendJoinCode,
  renewWorkerSession,
  respondToOffer,
  revealPassport,
  revokeSessions,
  flagTicketMismatch as flagTicketMismatchRecord,
  markTicketChecked as markTicketCheckedRecord,
  saveOnboarding,
  saveMyDetails,
  saveOtherLicences,
  saveSafety,
  saveTicket,
  saveTicketAnswers,
  saveTicketPhoto,
  submitApplication,
  submitBookLabour,
  submitInduction,
  saveSiteInduction,
  approveTimesheetForPay,
  correctTimesheet,
  queryTimesheet,
  submitTimesheet,
  verifyOtp,
  verifyWorker,
  type Ctx,
} from "@/lib/portal/services"
import { approveHeadshot as approveHeadshotRecord, rejectHeadshot as rejectHeadshotRecord, saveHeadshot } from "@/lib/portal/headshot"
import { toE164 } from "@/lib/portal/phone"
import {
  clearJoinDraft,
  clearOtpCookie,
  clearPendingCookie,
  clearSessionCookie,
  readJoinDraft,
  readOtpCookie,
  readPendingWorkerId,
  readSession,
  requireAdmin,
  writeJoinDraft,
  writeMobileCookie,
  writeOtpCookie,
  writePendingCookie,
  writeSessionCookie,
} from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"
import type { TicketEntry } from "@/lib/portal/ticket-entry"
import type { PhotoSide, Ticket, TicketType } from "@/lib/portal/types"

async function ctx(): Promise<Ctx> {
  const store = await getStore()
  const mode = portalMode()
  return { store, now: new Date(), mode, notify: createNotify(store, mode) }
}

function ip() {
  return headers().get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
}

function refresh() {
  revalidatePath("/portal")
  revalidatePath("/portal/admin")
}

async function restoreDemoOtp() {
  if (!isMock()) return
  const saved = readOtpCookie()
  if (!saved) return
  const store = await getStore()
  if (!(await store.challenges.get(saved.id))) await store.challenges.save(saved)
}

async function rememberDemoOtp(mobile: string) {
  if (!isMock()) return
  const target = toE164(mobile)
  if (!target) return
  const latest = (await (await getStore()).challenges.all())
    .filter((item) => item.target === target)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  if (latest) writeOtpCookie(latest)
}

export async function sendLoginCode(mobile: string) {
  const result = await requestOtp(await ctx(), { mobile, ip: ip() })
  if (result.ok) {
    writeMobileCookie(mobile)
    await rememberDemoOtp(mobile)
  }
  return result
}

export async function renewSession() {
  const current = await readSession()
  if (!current || current.worker.role !== "worker") return { ok: true as const }
  const result = await renewWorkerSession(await ctx(), current.session.id)
  if (result.renewed) writeSessionCookie(result.session)
  return { ok: true as const }
}

export async function checkLoginCode(mobile: string, code: string) {
  await restoreDemoOtp()
  const result = await verifyOtp(await ctx(), { mobile, code })
  if (!result.ok) {
    await rememberDemoOtp(mobile)
    return result
  }
  clearOtpCookie()
  if (result.needsTotp) {
    writePendingCookie(result.workerId, Date.now())
    return { ok: true as const, next: "/portal/login/admin" }
  }
  writeSessionCookie(result.session)
  clearPendingCookie()
  refresh()
  return { ok: true as const, next: result.session.role === "admin" ? "/portal/admin" : "/portal" }
}

export async function checkAdminCode(code: string) {
  const workerId = readPendingWorkerId()
  if (!workerId) return { ok: false as const, error: "That login expired. Request a new code." }
  const result = await confirmAdminTotp(await ctx(), workerId, code)
  if (!result.ok) return result
  writeSessionCookie(result.session)
  clearPendingCookie()
  refresh()
  return { ok: true as const, next: "/portal/admin" }
}

export async function sendMagicLink(email: string, confirmEmail: string) {
  return requestMagicLink(await ctx(), { email, confirmEmail, origin: siteOrigin() })
}

export async function logOut() {
  const current = await readSession()
  if (current) {
    const store = await getStore()
    await store.sessions.remove(current.session.id)
  }
  clearSessionCookie()
  clearPendingCookie()
  refresh()
  return { ok: true as const }
}

export async function makeInviteLink(input: unknown) {
  await requireAdmin()
  const result = await makeWorkerInvite(await ctx(), input)
  if (!result.ok) return result
  return { ok: true as const, url: siteOrigin() + result.path }
}

export async function sendBookLabour(input: unknown) {
  const result = await submitBookLabour(await ctx(), input, ip())
  return result
}

export async function sendJoinDetails(input: unknown) {
  const result = await prepareJoin(await ctx(), input, ip())
  if (!result.ok) return result
  writeJoinDraft(result.draft)
  writeMobileCookie(result.draft.mobile)
  await rememberDemoOtp(result.draft.mobile)
  return { ok: true as const, devCode: result.devCode }
}

export async function sendJoinCodeAgain() {
  const draft = readJoinDraft()
  if (!draft) return { ok: false as const, error: "Start again. Your details have expired." }
  const result = await resendJoinCode(await ctx(), draft.mobile, ip())
  if (!result.ok) return result
  await rememberDemoOtp(draft.mobile)
  return { ok: true as const, devCode: result.devCode }
}

export async function checkJoinCode(code: string) {
  await restoreDemoOtp()
  const draft = readJoinDraft()
  if (!draft) return { ok: false as const, error: "Start again. Your details have expired." }
  const result = await finishJoin(await ctx(), draft, code)
  if (!result.ok) {
    await rememberDemoOtp(draft.mobile)
    return result
  }
  clearOtpCookie()
  clearJoinDraft()
  writeSessionCookie(result.session)
  clearPendingCookie()
  refresh()
  return { ok: true as const, next: "/portal/onboarding" }
}

export async function applyForWork(input: unknown) {
  const result = await submitApplication(await ctx(), input)
  if (result.ok) refresh()
  return result
}

export async function saveDetails(input: { suburb: string; postcode: string }) {
  const current = await readSession()
  if (!current || current.worker.role !== "worker") return { ok: false as const, error: "Log in again." }
  const result = await saveMyDetails(await ctx(), current.worker.id, input)
  if (result.ok) refresh()
  return result
}

export async function saveSafetyInfo(input: {
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
  medicalNotes?: string
  safetyMedication: string
  medicalSharing: string
}) {
  const current = await readSession()
  if (!current || current.worker.role !== "worker") return { ok: false as const, error: "Log in again." }
  const result = await saveSafety(await ctx(), current.worker.id, input)
  if (result.ok) refresh()
  return result
}

export async function saveInduction(input: { name: string; done?: boolean }) {
  const current = await readSession()
  if (!current || current.worker.role !== "worker") return { ok: false as const, error: "Log in again." }
  const result = await saveSiteInduction(await ctx(), current.worker.id, input)
  if (result.ok) {
    revalidatePath("/portal/inductions")
    revalidatePath("/portal/me")
    revalidatePath("/portal")
  }
  return result
}

export async function saveProfile(patch: Record<string, unknown>) {
  const current = await readSession()
  if (!current) return { ok: false as const, error: "Log in again." }
  const result = await saveOnboarding(await ctx(), current.worker.id, patch)
  if (result.ok) refresh()
  return result
}

export async function updateTicket(type: TicketType, ticket: Ticket & TicketEntry) {
  const current = await readSession()
  if (!current || current.worker.role === "admin") return { ok: false as const, error: "Log in as a worker." }
  const result = await saveTicket(await ctx(), current.worker.id, type, ticket)
  if (result.ok) refresh()
  return result
}

export async function saveTicketStep(input: {
  tickets: Partial<Record<TicketType, string | (TicketEntry & { status?: string })>>
  otherTicketsHeld: string[]
  otherDetails?: Record<string, TicketEntry>
}) {
  const current = await readSession()
  if (!current || current.worker.role === "admin") return { ok: false as const, error: "Log in as a worker." }
  const result = await saveTicketAnswers(await ctx(), current.worker.id, input)
  if (result.ok) refresh()
  return result
}

export async function saveHeldLicences(otherTicketsHeld: string[], details: Record<string, TicketEntry> = {}) {
  const current = await readSession()
  if (!current || current.worker.role === "admin") return { ok: false as const, error: "Log in as a worker." }
  const result = await saveOtherLicences(await ctx(), current.worker.id, otherTicketsHeld, details)
  if (result.ok) refresh()
  return result
}

export async function uploadHeadshot(formData: FormData) {
  const current = await readSession()
  if (!current || current.worker.role !== "worker") return { ok: false as const, error: "Log in as a worker." }
  const file = formData.get("file")
  if (!(file instanceof File)) return { ok: false as const, error: "Choose a photo." }
  const result = await saveHeadshot(await ctx(), current.worker.id, {
    bytes: Buffer.from(await file.arrayBuffer()),
    consent: formData.get("consent") === "yes",
  })
  if (result.ok) refresh()
  return result
}

export async function approveHeadshot(documentId: string) {
  const current = await readSession()
  if (!current || current.worker.role !== "admin") return { ok: false as const, error: "Mav's login is required." }
  const result = await approveHeadshotRecord(await ctx(), current.worker.id, documentId)
  if (result.ok) refresh()
  return result
}

export async function rejectHeadshot(documentId: string, reason: string) {
  const current = await readSession()
  if (!current || current.worker.role !== "admin") return { ok: false as const, error: "Mav's login is required." }
  const result = await rejectHeadshotRecord(await ctx(), current.worker.id, documentId, reason)
  if (result.ok) refresh()
  return result
}

export async function uploadTicketPhoto(formData: FormData) {
  const current = await readSession()
  if (!current || current.worker.role === "admin") return { ok: false as const, error: "Log in as a worker." }
  const file = formData.get("file")
  if (!(file instanceof File)) return { ok: false as const, error: "Choose a photo." }
  const side = String(formData.get("side") || "")
  if (side !== "front" && side !== "back") return { ok: false as const, error: "Choose the front or the back of the card." }
  const result = await saveTicketPhoto(await ctx(), current.worker.id, {
    bytes: Buffer.from(await file.arrayBuffer()),
    licenceKey: String(formData.get("licenceKey") || ""),
    side: side as PhotoSide,
  })
  if (result.ok) refresh()
  return result
}

export async function flagTicketMismatch(input: { workerId: string; licenceKey: string }) {
  const current = await readSession()
  if (!current || current.worker.role !== "admin") return { ok: false as const, error: "Mav's login is required." }
  const result = await flagTicketMismatchRecord(await ctx(), current.worker.id, input.workerId, input.licenceKey)
  if (result.ok) refresh()
  return result
}

export async function markTicketChecked(input: { workerId: string; licenceKey: string; number: string; expiry: string; noExpiry: boolean }) {
  const current = await readSession()
  if (!current || current.worker.role !== "admin") return { ok: false as const, error: "Mav's login is required." }
  const result = await markTicketCheckedRecord(await ctx(), current.worker.id, input.workerId, input)
  if (result.ok) refresh()
  return result
}

export async function finishInduction(input: { answers: number[]; typedName?: string; signaturePng?: string }) {
  const current = await readSession()
  if (!current) return { ok: false as const, error: "Log in again." }
  const result = await submitInduction(await ctx(), current.worker.id, input)
  if (result.ok && result.pass && !result.needsSignature) refresh()
  return result
}

export async function answerOffer(offerId: string, accept: boolean, reason?: string) {
  const current = await readSession()
  if (!current) return { ok: false as const, error: "Log in again." }
  const result = await respondToOffer(await ctx(), { workerId: current.worker.id, offerId, accept, reason })
  if (result.ok) refresh()
  return result
}

export async function lodgeTimesheet(input: {
  offerId: string
  workDate: string
  start: string
  finish: string
  breakMinutes: number
  breakStart?: string
  tasks?: string | string[]
  taskNote?: string
  incident: boolean
  incidentNote?: string
  workerConfirmed: boolean
  confirmUnusualHours?: boolean
  supervisorName: string
  supervisorEmail: string
  supervisorRole: string
  supervisorConfirmed: boolean
  signaturePng: string
}) {
  const current = await readSession()
  if (!current) return { ok: false as const, error: "Log in again." }
  const result = await submitTimesheet(await ctx(), {
    ...input,
    workerId: current.worker.id,
    ip: ip(),
    userAgent: headers().get("user-agent") || "",
  })
  if (result.ok) refresh()
  return result
}

export async function adjustTimesheet(sheetId: string, patch: { start: string; finish: string; breakMinutes: number; breakStart?: string; note?: string }) {
  const current = await readSession()
  if (!current || current.worker.role !== "admin") return { ok: false as const, error: "Mav's login is required." }
  const result = await correctTimesheet(await ctx(), current.worker.id, sheetId, patch)
  if (result.ok) refresh()
  return result
}

export async function approveTimesheet(sheetId: string) {
  const current = await readSession()
  if (!current || current.worker.role !== "admin") return { ok: false as const, error: "Mav's login is required." }
  const result = await approveTimesheetForPay(await ctx(), current.worker.id, sheetId)
  if (result.ok) refresh()
  return result
}

export async function markTimesheetQueried(sheetId: string, note?: string) {
  const current = await readSession()
  if (!current || current.worker.role !== "admin") return { ok: false as const, error: "Mav's login is required." }
  const result = await queryTimesheet(await ctx(), current.worker.id, sheetId, note)
  if (result.ok) refresh()
  return result
}

export async function sendShiftOffers(input: Parameters<typeof createOffers>[2]) {
  const current = await readSession()
  if (!current || current.worker.role !== "admin") return { ok: false as const, error: "Mav's login is required." }
  const result = await createOffers(await ctx(), current.worker.id, input)
  if (result.ok) refresh()
  return result
}

export async function saveVerification(workerId: string, patch: Parameters<typeof verifyWorker>[3]) {
  const current = await readSession()
  if (!current || current.worker.role !== "admin") return { ok: false as const, error: "Mav's login is required." }
  const result = await verifyWorker(await ctx(), current.worker.id, workerId, patch)
  if (result.ok) refresh()
  return result
}

export async function showPassport(workerId: string) {
  const current = await readSession()
  if (!current || current.worker.role !== "admin") return { ok: false as const, error: "Mav's login is required." }
  return revealPassport(await ctx(), current.worker.id, workerId)
}

export async function removeImages(workerId: string) {
  const current = await readSession()
  if (!current || current.worker.role !== "admin") return { ok: false as const, error: "Mav's login is required." }
  const result = await deleteWorkerImages(await ctx(), current.worker.id, workerId)
  if (result.ok) refresh()
  return result
}

export async function signOutWorker(workerId: string) {
  const current = await readSession()
  if (!current || current.worker.role !== "admin") return { ok: false as const, error: "Mav's login is required." }
  return revokeSessions(await ctx(), current.worker.id, workerId)
}

export async function devMode() {
  return isMock()
}
