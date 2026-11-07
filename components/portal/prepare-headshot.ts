const EDGE = 600
const MAX_BYTES = 150 * 1024
const UPLOAD_MAX = 10 * 1024 * 1024

function isHeic(file: File) {
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return type === "image/heic" || type === "image/heif" || name.endsWith(".heic") || name.endsWith(".heif")
}

export async function prepareHeadshot(file: File): Promise<{ ok: true; file: File } | { ok: false; error: string }> {
  if (isHeic(file)) return { ok: false, error: "Use a JPG or PNG photo so the location data can be removed." }
  if (file.size > UPLOAD_MAX) return { ok: false, error: "That photo is over 10 MB. Take it again a little further from your face." }
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) return { ok: false, error: "Use a JPG or PNG photo." }
  const side = Math.min(bitmap.width, bitmap.height)
  const edge = Math.max(1, Math.min(EDGE, side))
  const canvas = document.createElement("canvas")
  canvas.width = edge
  canvas.height = edge
  const context = canvas.getContext("2d")
  if (!context) {
    bitmap.close()
    return { ok: false, error: "That photo could not be prepared. Try another one." }
  }
  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, edge, edge)
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, edge, edge)
  bitmap.close()
  let quality = 0.8
  let blob: Blob | null = null
  while (quality >= 0.5) {
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality))
    if (blob && blob.size <= MAX_BYTES) break
    quality = Math.round((quality - 0.1) * 10) / 10
  }
  if (!blob || blob.size > MAX_BYTES) return { ok: false, error: "That photo is still too big. Move a little further away and try again." }
  return { ok: true, file: new File([blob], "headshot.jpg", { type: "image/jpeg" }) }
}
