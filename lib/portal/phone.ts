export function toE164(input: string): string | null {
  const digits = input.replace(/\D/g, "")
  let local = digits
  if (local.startsWith("61")) local = local.slice(2)
  else if (local.startsWith("0")) local = local.slice(1)
  if (local.length !== 9 || !local.startsWith("4")) return null
  return "+61" + local
}

export function formatAuMobile(e164: string): string {
  const digits = e164.replace(/\D/g, "")
  const local = digits.startsWith("61") ? "0" + digits.slice(2) : digits
  if (local.length !== 10) return e164
  return local.slice(0, 4) + " " + local.slice(4, 7) + " " + local.slice(7)
}
