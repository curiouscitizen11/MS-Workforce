import { createHash, randomBytes } from "crypto"

export function newId(prefix = ""): string {
  const id = randomBytes(9).toString("hex")
  return prefix ? prefix + "_" + id : id
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}
