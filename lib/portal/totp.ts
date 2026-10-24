import { createHmac, timingSafeEqual } from "crypto"

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

export function base32Decode(input: string): Buffer {
  const clean = input.replace(/=+$/g, "").replace(/\s/g, "").toUpperCase()
  let bits = ""
  for (const char of clean) {
    const value = ALPHABET.indexOf(char)
    if (value < 0) throw new Error("The authenticator secret is not valid.")
    bits += value.toString(2).padStart(5, "0")
  }
  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2))
  }
  return Buffer.from(bytes)
}

export function totpCode(secret: string, nowMs: number, step = 30, digits = 6): string {
  const counter = Math.floor(nowMs / 1000 / step)
  const buf = Buffer.alloc(8)
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0)
  buf.writeUInt32BE(counter >>> 0, 4)
  const hmac = createHmac("sha1", base32Decode(secret)).update(buf).digest()
  const offset = hmac[hmac.length - 1] & 0xf
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3]
  return String(bin % 10 ** digits).padStart(digits, "0")
}

export function verifyTotp(code: string, secret: string, nowMs: number): boolean {
  const clean = code.replace(/\s/g, "")
  if (!/^\d{6}$/.test(clean)) return false
  for (const skew of [-1, 0, 1]) {
    const expected = totpCode(secret, nowMs + skew * 30000)
    if (timingSafeEqual(Buffer.from(expected), Buffer.from(clean))) return true
  }
  return false
}
