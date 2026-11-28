export const JOBS_EMAIL = "jobs@msworkforce.au"
export const JOBS_MAILTO = "mailto:" + JOBS_EMAIL
export const CONTACT_LINE = "Contact MS Workforce at " + JOBS_EMAIL

/** The public number, from BUSINESS_PHONE. Blank when it is unset or not a phone. */
export function businessPhone(raw = process.env.BUSINESS_PHONE): string {
  const value = (raw || "").trim().replace(/\s+/g, " ")
  if (!value) return ""
  if (!/^[\d+\s()-]+$/.test(value)) return ""
  const digits = value.replace(/\D/g, "")
  if (digits.length < 8 || digits.length > 15) return ""
  return value
}

export function telHref(phone: string): string {
  return "tel:" + phone.replace(/[^\d+]/g, "")
}

/** A sentence. Starts with "Call" when a number is set, otherwise the jobs email line. */
export function contactSentence(phone = businessPhone()): string {
  if (!phone) return CONTACT_LINE
  return "Call MS Workforce on " + phone
}

/** Same sentence, for the middle of another sentence. */
export function contactAsk(phone = businessPhone()): string {
  const line = contactSentence(phone)
  return line.charAt(0).toLowerCase() + line.slice(1)
}
