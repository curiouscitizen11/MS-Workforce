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
  requestOtp,
  respondToOffer,
  revealPassport,
  revokeSessions,
  saveOnboarding,
  saveTicket,
  saveUpload,
  submitApplication,
  submitInduction,
  correctTimesheet,
  queryTimesheet,
  submitTimesheet,
  verifyOtp,
  verifyWorker,
  type Ctx,
} from "@/lib/portal/services"
import { toE164 } from "@/lib/portal/phone"
import {
  clearOtpCookie,
  clearPendingCookie,
  clearSessionCookie,
  readOtpCookie,
  readPendingWorkerId,
  readSession,
  writeOtpCookie,
  writePendingCookie,
  writeSessionCookie,
} from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"
import type { Ticket, TicketType } from "@/lib/portal/types"

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
  if (result.ok) await rememberDemoOtp(mobile)
  return result
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

export async function applyForWork(input: unknown) {
  const result = await submitApplication(await ctx(), input)
  if (result.ok) refresh()
  return result
}

export async function saveProfile(patch: Record<string, unknown>) {
  const current = await readSession()
  if (!current) return { ok: false as const, error: "Log in again." }
  const result = await saveOnboarding(await ctx(), current.worker.id, patch)
  if (result.ok) refresh()
  return result
}

export async function updateTicket(type: TicketType, ticket: Ticket) {
  const current = await readSession()
  if (!current || current.worker.role === "admin") return { ok: false as const, error: "Log in as a worker." }
  const result = await saveTicket(await ctx(), current.worker.id, type, ticket)
  if (result.ok) refresh()
  return result
}

export async function uploadDocument(formData: FormData) {
  const current = await readSession()
  if (!current || current.worker.role === "admin") return { ok: false as const, error: "Log in as a worker." }
  const file = formData.get("file")
  if (!(file instanceof File)) return { ok: false as const, error: "Choose a photo." }
  const bytes = Buffer.from(await file.arrayBuffer())
  const kind = formData.get("kind") === "id" ? "id" : "ticket"
  const ticketType = String(formData.get("ticketType") || "") as TicketType
  const result = await saveUpload(await ctx(), current.worker.id, {
    bytes,
    kind,
    ticketType: kind === "ticket" ? ticketType : undefined,
  })
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

export async function adjustTimesheet(sheetId: string, patch: { start: string; finish: string; breakMinutes: number; note?: string }) {
  const current = await readSession()
  if (!current || current.worker.role !== "admin") return { ok: false as const, error: "Mav's login is required." }
  const result = await correctTimesheet(await ctx(), current.worker.id, sheetId, patch)
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
