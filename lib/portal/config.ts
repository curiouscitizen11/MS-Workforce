export function portalMode(): "mock" | "live" {
  const forced = process.env.PORTAL_MODE
  if (forced === "live") return "live"
  if (forced === "mock") return "mock"
  // Preview deploys stay in the demo, even when the project copied live keys across.
  if (process.env.VERCEL_ENV === "preview") return "mock"
  if (process.env.DATABASE_URL && process.env.NOTION_TOKEN) return "live"
  return "mock"
}

export function isMock(): boolean {
  return portalMode() === "mock"
}

function secret(name: string, mockFallback: string): string {
  const value = process.env[name]
  if (value) return value
  if (isMock()) return mockFallback
  throw new Error(name + " is required when the portal is live.")
}

export function sessionSecret(): string {
  return secret("PORTAL_SESSION_SECRET", "mock-only-session-secret")
}

export function signingSecret(): string {
  return secret("PORTAL_SIGNING_SECRET", "mock-only-signing-secret")
}

export function adminTotpSecret(): string {
  return secret("ADMIN_TOTP_SECRET", "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ")
}

export function adminEmail(): string {
  return process.env.ADMIN_EMAIL || "hello@msworkforce.au"
}

export function adminMobile(): string {
  return process.env.ADMIN_MOBILE || "+61400000001"
}

export function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "")
}

export const OTP_TTL_MS = 10 * 60 * 1000
export const OTP_LOCK_MS = 15 * 60 * 1000
export const OTP_MAX_ATTEMPTS = 5
export const OTP_MAX_SENDS = 3
export const OTP_SEND_WINDOW_MS = 15 * 60 * 1000
export const OTP_IP_MAX = 20
export const OTP_IP_WINDOW_MS = 60 * 60 * 1000
export const WORKER_SESSION_MS = 30 * 24 * 60 * 60 * 1000
export const ADMIN_SESSION_MS = 12 * 60 * 60 * 1000
export const MAGIC_TTL_MS = 30 * 60 * 1000
export const PENDING_2FA_MS = 5 * 60 * 1000
export const PASSPORT_TTL_MS = 14 * 24 * 60 * 60 * 1000
export const DOCUMENT_KEEP_MS = 7 * 24 * 60 * 60 * 1000
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
