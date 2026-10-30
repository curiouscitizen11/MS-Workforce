const TFN = /(?<!\d)\d{9}(?!\d)/
const BSB = /(?<!\d)\d{3}[-\s]\d{3}(?!\d)/
const WORDS = /\b(tfn|tax file|bsb|superannuation|super fund|bank account|account number)\b/i

export type SensitiveKind = "tfn" | "bsb" | "bank-or-super"

export function sensitiveFindings(text: string): SensitiveKind[] {
  const found: SensitiveKind[] = []
  if (TFN.test(text)) found.push("tfn")
  if (BSB.test(text)) found.push("bsb")
  if (WORDS.test(text)) found.push("bank-or-super")
  return found
}

export const SENSITIVE_MESSAGE =
  "Don't put tax file, bank or super details here. Those stay in Xero."

export function sensitiveMessage(text: string): string | null {
  return sensitiveFindings(text).length ? SENSITIVE_MESSAGE : null
}
