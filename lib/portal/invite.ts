import { createHmac, timingSafeEqual } from "crypto"
import { signingSecret } from "@/lib/portal/config"
import { decryptString, encryptString } from "@/lib/portal/crypto"
import { sydneyToday } from "@/lib/portal/dates"

const PURPOSE = "invite-worker"
const TTL_MS = 14 * 24 * 60 * 60 * 1000

type InvitePayload = {
  purpose: typeof PURPOSE
  name: string
  mobile: string
  exp: number
  madeOn: string
}

export function invitedAsLabel(name: string, isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  const monthName = new Intl.DateTimeFormat("en-AU", { month: "short", timeZone: "UTC" }).format(date)
  return "Invited as " + name.trim() + ", " + day + " " + monthName
}

function sign(sealed: string) {
  return createHmac("sha256", signingSecret()).update(PURPOSE + "." + sealed).digest("base64url")
}

function matches(left: string, right: string) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function createInviteToken(name: string, mobile: string, nowMs = Date.now()) {
  const payload: InvitePayload = {
    purpose: PURPOSE,
    name: name.trim(),
    mobile,
    exp: nowMs + TTL_MS,
    madeOn: sydneyToday(new Date(nowMs)),
  }
  const sealed = encryptString(JSON.stringify(payload))
  return Buffer.from(sealed, "utf8").toString("base64url") + "." + sign(sealed)
}

export type InviteRead =
  | { ok: true; name: string; mobile: string; madeOn: string; invitedAs: string }
  | { ok: false; reason: "expired" | "invalid" }

export function readInviteToken(token: string, nowMs = Date.now()): InviteRead {
  const dot = token.lastIndexOf(".")
  if (dot <= 0) return { ok: false, reason: "invalid" }
  const signature = token.slice(dot + 1)
  let sealed = ""
  try {
    sealed = Buffer.from(token.slice(0, dot), "base64url").toString("utf8")
  } catch {
    return { ok: false, reason: "invalid" }
  }
  if (!signature || !matches(signature, sign(sealed))) return { ok: false, reason: "invalid" }
  let payload: InvitePayload
  try {
    payload = JSON.parse(decryptString(sealed)) as InvitePayload
  } catch {
    return { ok: false, reason: "invalid" }
  }
  if (payload.purpose !== PURPOSE || !payload.name || !payload.mobile || !payload.madeOn || !payload.exp) {
    return { ok: false, reason: "invalid" }
  }
  if (payload.exp < nowMs) return { ok: false, reason: "expired" }
  return {
    ok: true,
    name: payload.name,
    mobile: payload.mobile,
    madeOn: payload.madeOn,
    invitedAs: invitedAsLabel(payload.name, payload.madeOn),
  }
}
