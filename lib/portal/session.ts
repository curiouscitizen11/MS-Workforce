import { createHmac, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { PENDING_2FA_MS, sessionSecret } from "@/lib/portal/config"
import { getStore } from "@/lib/portal/store"
import type { Session, Worker } from "@/lib/portal/types"

const COOKIE = "msw_portal"
const PENDING = "msw_admin_pending"

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url")
}

function matches(left: string, right: string) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function writeSessionCookie(session: Session) {
  cookies().set(COOKIE, session.id + "." + sign(session.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(session.expiresAt),
  })
}

export function clearSessionCookie() {
  cookies().set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 })
}

export function writePendingCookie(workerId: string, nowMs: number) {
  const exp = Math.floor(nowMs / 1000) + PENDING_2FA_MS / 1000
  const payload = workerId + "." + exp
  cookies().set(PENDING, payload + "." + sign(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PENDING_2FA_MS / 1000,
  })
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
  const raw = cookies().get(COOKIE)?.value
  if (!raw) return null
  const dot = raw.lastIndexOf(".")
  if (dot <= 0) return null
  const id = raw.slice(0, dot)
  const signature = raw.slice(dot + 1)
  if (!matches(signature, sign(id))) return null
  const store = await getStore()
  const session = await store.sessions.get(id)
  if (!session || Date.parse(session.expiresAt) < Date.now()) return null
  const worker = await store.workers.get(session.workerId)
  if (!worker || worker.status === "Inactive") return null
  return { session, worker }
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
