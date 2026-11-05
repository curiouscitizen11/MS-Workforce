import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto"
import { portalMode } from "@/lib/portal/config"

function key(): Buffer {
  const raw = process.env.PORTAL_ENCRYPTION_KEY
  if (raw) return scryptSync(raw, "msw-portal", 32)
  if (portalMode() === "mock") return scryptSync("mock-dev-encryption-key", "msw-portal", 32)
  throw new Error("PORTAL_ENCRYPTION_KEY is required before passport numbers can be stored.")
}

export function encryptString(plain: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key(), iv)
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString("base64")
}

export function decryptString(payload: string): string {
  const buf = Buffer.from(payload, "base64")
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const encrypted = buf.subarray(28)
  const decipher = createDecipheriv("aes-256-gcm", key(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8")
}
