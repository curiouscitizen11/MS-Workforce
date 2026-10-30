const MAX_EDGE = 1600
const MAX_BYTES = 8 * 1024 * 1024

function isHeic(file: File): boolean {
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return type === "image/heic" || type === "image/heif" || name.endsWith(".heic") || name.endsWith(".heif")
}

function isJpeg(file: File): boolean {
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return type === "image/jpeg" || type === "image/jpg" || name.endsWith(".jpg") || name.endsWith(".jpeg")
}

function isPng(file: File): boolean {
  const name = file.name.toLowerCase()
  return file.type.toLowerCase() === "image/png" || name.endsWith(".png")
}

async function compressRaster(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")
  if (!context) {
    bitmap.close()
    return file
  }
  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, width, height)
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8))
  if (!blob) return file
  const base = file.name.replace(/\.[^.]+$/, "") || "card"
  return new File([blob], base + ".jpg", { type: "image/jpeg" })
}

export async function prepareTicketPhoto(file: File): Promise<{ ok: true; file: File } | { ok: false; error: string }> {
  if (!isHeic(file) && !isJpeg(file) && !isPng(file)) {
    return { ok: false, error: "Use a JPG, PNG or HEIC photo." }
  }
  if (isHeic(file)) {
    if (file.size > MAX_BYTES) {
      return { ok: false, error: "That photo is over 8 MB. Take it again a little further from the card." }
    }
    return { ok: true, file }
  }
  try {
    const compressed = await compressRaster(file)
    if (compressed.size > MAX_BYTES) {
      return { ok: false, error: "That photo is over 8 MB. Take it again a little further from the card." }
    }
    return { ok: true, file: compressed }
  } catch {
    if (file.size > MAX_BYTES) {
      return { ok: false, error: "That photo is over 8 MB. Take it again a little further from the card." }
    }
    return { ok: true, file }
  }
}
