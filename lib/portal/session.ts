import { createHmac, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { PENDING_2FA_MS, isMock, sessionSecret } from "@/lib/portal/config"
import { getStore } from "@/lib/portal/store"
import type { OtpChallenge, Session, Worker } from "@/lib/portal/types"

const COOKIE = "msw_portal"
const PENDING = "msw_admin_pending"
const OTP = "msw_demo_otp"
const MOBILE = "msw_mobile"

function cookieOptions(maxAge?: number, expires?: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(maxAge !== undefined ? { maxAge } : {}),
    ...(expires ? { expires } : {}),
  }
}

function pack(value: unknown) {
  const body = Buffer.from(JSON.stringify(value)).toString("base64url")
  return body + "." + sign(body)
}

function unpack<T>(raw: string | undefined): T | null {
  if (!raw) return null
  const dot = raw.lastIndexOf(".")
  if (dot <= 0) return null
  const body = raw.slice(0, dot)
  const signature = raw.slice(dot + 1)
  if (!matches(signature, sign(body))) return null
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T
  } catch {
    return null
  }
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url")
}

function matches(left: string, right: string) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function sessionCookieValue(session: Session) {
  return pack({
    id: session.id,
    workerId: session.workerId,
    role: session.role,
    expiresAt: session.expiresAt,
  })
}

export function writeSessionCookie(session: Session) {
  cookies().set(COOKIE, sessionCookieValue(session), cookieOptions(undefined, new Date(session.expiresAt)))
}

export function writeOtpCookie(challenge: OtpChallenge) {
  if (!isMock()) return
  cookies().set(OTP, pack(challenge), cookieOptions(10 * 60))
}

export function readOtpCookie() {
  return unpack<OtpChallenge>(cookies().get(OTP)?.value)
}

export function clearOtpCookie() {
  cookies().set(OTP, "", cookieOptions(0))
}

export function clearSessionCookie() {
  cookies().set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 })
}

export function writeMobileCookie(mobile: string) {
  cookies().set(MOBILE, mobile, cookieOptions(365 * 24 * 60 * 60))
}

export function readMobileCookie() {
  return cookies().get(MOBILE)?.value || ""
}

export function writePendingCookie(workerId: string, nowMs: number) {
  const exp = Math.floor(nowMs / 1000) + PENDING_2FA_MS / 1000
  const payload = workerId + "." + exp
  cookies().set(PENDING, payload + "." + sign(payload), cookieOptions(PENDING_2FA_MS / 1000))
}

export function clearPendingCookie() {
  cookies().set(PENDING, "", { httpOnly: true, path: "/", maxAge: 0 })
}

export function readPendingWorkerId(nowMs = Date.now()) {
  const raw = cookies().get(PENDING)?.value
  if (!raw) return null
  const [workerId, exp, signature] = raw.split(".")
  if (!workerId || !exp || !signature) return null
  if (Number(exp) * 1000 < nowMs) return null
  if (!matches(signature, sign(workerId + "." + exp))) return null
  return workerId
}

export async function readSession(): Promise<{ session: Session; worker: Worker } | null> {
  const parsed = unpack<{ id: string; workerId: string; role: "worker" | "admin"; expiresAt: string }>(
    cookies().get(COOKIE)?.value,
  )
  if (!parsed?.id || !parsed.workerId || !parsed.expiresAt) return null
  if (Date.parse(parsed.expiresAt) < Date.now()) return null
  const store = await getStore()
  const stored = await store.sessions.get(parsed.id)
  if (!isMock()) {
    if (!stored || stored.workerId !== parsed.workerId || Date.parse(stored.expiresAt) < Date.now()) return null
  }
  const session = stored || {
    id: parsed.id,
    workerId: parsed.workerId,
    role: parsed.role,
    createdAt: parsed.expiresAt,
    expiresAt: parsed.expiresAt,
  }
  if (session.workerId !== parsed.workerId) return null
  const worker = await store.workers.get(session.workerId)
  if (!worker || worker.status === "Inactive" || worker.role !== session.role) return null
  return { session: { ...session, role: worker.role }, worker }
}

export async function requireUser() {
  const current = await readSession()
  if (!current) redirect("/portal/login")
  return current
}

export async function requireAdmin() {
  const current = await requireUser()
  if (current.worker.role !== "admin") redirect("/portal")
  return current
}
