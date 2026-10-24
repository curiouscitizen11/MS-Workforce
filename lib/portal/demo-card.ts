import { crc32, deflateSync } from "zlib"

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const name = Buffer.from(type, "ascii")
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])) >>> 0, 0)
  return Buffer.concat([length, name, data, crc])
}

/** A small private demo card image. Front is navy, back is teal, so the admin screen can show both sides. */
export function demoCardPng(side: "front" | "back"): Buffer {
  const width = 320
  const height = 200
  const background = side === "front" ? [10, 37, 64] : [15, 118, 110]
  const stripe = side === "front" ? [20, 184, 166] : [232, 238, 244]
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1)
    raw[row] = 0
    for (let x = 0; x < width; x += 1) {
      const band = y < 28 || (y > 78 && y < 92) || x < 16 || x > width - 17
      const color = band ? stripe : background
      const index = row + 1 + x * 4
      raw[index] = color[0]
      raw[index + 1] = color[1]
      raw[index + 2] = color[2]
      raw[index + 3] = 255
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ])
}
