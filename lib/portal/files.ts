import { createHmac, timingSafeEqual } from "crypto"

export function sniffFile(buf: Buffer): "jpeg" | "png" | "webp" | "pdf" | "heic" | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg"
  if (
    buf.length >= 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "png"
  }
  if (buf.length >= 5 && buf.subarray(0, 5).toString("ascii") === "%PDF-") return "pdf"
  if (buf.length >= 12 && buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") {
    return "webp"
  }
  if (buf.length >= 12 && buf.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = buf.subarray(8, 12).toString("ascii")
    if (brand === "heic" || brand === "heif" || brand === "mif1" || brand === "heix") return "heic"
  }
  return null
}

export function contentTypeFor(kind: NonNullable<ReturnType<typeof sniffFile>>): string {
  if (kind === "jpeg") return "image/jpeg"
  if (kind === "png") return "image/png"
  if (kind === "webp") return "image/webp"
  if (kind === "pdf") return "application/pdf"
  return "image/heic"
}

/** Drop the JPEG APP1 segment, which is where cameras store location data. */
export function stripJpegExif(input: Buffer): Buffer {
  if (input.length < 4 || input[0] !== 0xff || input[1] !== 0xd8) return input
  const parts: Buffer[] = [input.subarray(0, 2)]
  let i = 2
  while (i + 4 <= input.length) {
    if (input[i] !== 0xff) {
      parts.push(input.subarray(i))
      return Buffer.concat(parts)
    }
    const marker = input[i + 1]
    if (marker === 0xda || marker === 0xd9) {
      parts.push(input.subarray(i))
      return Buffer.concat(parts)
    }
    const length = input.readUInt16BE(i + 2)
    const end = i + 2 + length
    if (length < 2 || end > input.length) return input
    if (marker !== 0xe1) parts.push(input.subarray(i, end))
    i = end
  }
  return Buffer.concat(parts)
}

function mac(id: string, expSec: number, secret: string): string {
  return createHmac("sha256", secret).update(id + "." + expSec).digest("base64url")
}

export function signFileToken(id: string, expSec: number, secret: string): string {
  return mac(id, expSec, secret)
}

export function verifyFileToken(
  id: string,
  expSec: number,
  signature: string,
  secret: string,
  nowMs: number,
): boolean {
  if (!Number.isFinite(expSec) || nowMs / 1000 > expSec) return false
  const expected = mac(id, expSec, secret)
  const left = Buffer.from(expected)
  const right = Buffer.from(signature)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

/** Signed links last at most 5 minutes. */
export function signedFilePath(id: string, nowMs: number, secret: string, ttlSec = 300): string {
  const ttl = Math.min(Math.max(1, Math.floor(ttlSec)), 300)
  const exp = Math.floor(nowMs / 1000) + ttl
  const signature = signFileToken(id, exp, secret)
  return `/api/portal/files/${id}?exp=${exp}&sig=${signature}`
}
