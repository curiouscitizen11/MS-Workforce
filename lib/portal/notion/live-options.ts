/** Live Notion option names. The en dash is required. Notion rejects a comma in a choice. */

const EN = "\u2013"

export const LIVE_TICKET_OPTIONS = [
  "Yes " + EN + " I have it",
  "No",
  "Booked in for the course",
  "Held",
  "Not held",
  "Expired",
  "Booked in / training now",
] as const

export const LIVE_ROLES = [
  "General labourer",
  "Trade assistant",
  "Site clean",
  "Materials handling",
  "Demolition / strip-out",
  "Concrete labourer",
  "Asbestos removal labourer (Class B)",
  "Landscaping labourer",
  "Other " + EN + " please explain",
] as const

export const LIVE_EXPERIENCE = [
  "No construction experience yet",
  "Under 6 months",
  "6" + EN + "12 months",
  "1" + EN + "2 years",
  "3" + EN + "5 years",
  "More than 5 years",
  "Other " + EN + " please explain",
] as const

export const LIVE_WORK_AREAS = [
  "Northern Beaches",
  "North Shore",
  "Sydney CBD and inner city",
  "Eastern Suburbs",
  "Inner West",
  "Hills District",
  "Parramatta and Western Sydney",
  "South West Sydney",
  "Sutherland Shire and St George",
  "Central Coast",
  "Anywhere in Greater Sydney",
  "Other " + EN + " please explain",
] as const

/** Work days does not list each weekday. A partial week cannot be stored until those choices exist. */
export const LIVE_WORK_DAYS = ["Monday through Sunday", "Short notice OK"] as const

export const LIVE_WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const

export const LIVE_RTW = ["Australian citizen", "Permanent resident", "New Zealand citizen", "Visa holder", "Other"] as const

export const LIVE_RIGHT_TO_WORK = ["Yes", "No", "Pending"] as const

export const LIVE_VEVO_METHODS = [
  "I'll email my VEVO result from the myVEVO app",
  "Show my passport on a video call",
  "Show my passport in person",
  "Other " + EN + " please explain",
] as const

export const LIVE_VEVO_RESULTS = ["Work rights OK", "Limited hours", "No work rights", "Not needed (citizen/PR)"] as const

export const LIVE_OTHER_TICKETS = [
  "Asbestos awareness",
  "Silica awareness",
  "Manual handling",
  "Forklift (LF)",
  "EWP over 11 m (WP licence)",
  "EWP under 11 m (yellow card)",
  "Telehandler",
  "Dogging (DG)",
  "Basic rigging (RB)",
  "Basic scaffolding (SB)",
  "Plant ticket (excavator / skid steer / roller)",
  "Test and tag",
  "None of these",
  "Other " + EN + " please explain",
] as const

export const LIVE_TRANSPORT = [
  "Own car",
  "Public transport",
  "Lift / carpool",
  "Motorbike or bicycle",
  "Other " + EN + " please explain",
] as const

export const LIVE_FITNESS = [
  "Yes " + EN + " I can safely do these tasks",
  "Yes " + EN + " with some adjustments (please call me)",
  "Not sure " + EN + " please call me",
] as const

export const LIVE_RELATIONSHIPS = [
  "Partner or spouse",
  "Parent",
  "Brother or sister",
  "Son or daughter",
  "Other relative",
  "Friend",
  "Housemate",
  "Other " + EN + " please explain",
] as const

export const LIVE_LICENCE_STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT", "Overseas", "Other " + EN + " please explain"] as const

export const LIVE_ID_METHODS = ["Video call", "In person", "Service NSW app", "Other"] as const

export const LIVE_ALLERGIES = ["No", "Yes", "I'd rather tell MS Workforce by phone"] as const

export const LIVE_ALLERGY_TYPES = [
  "Bee or wasp stings",
  "Other insect bites",
  "Foods (e.g. nuts or shellfish)",
  "Medicines (e.g. penicillin)",
  "Latex",
  "Plants or pollen",
  "Dust or chemicals",
  "Other " + EN + " please explain",
] as const

export const LIVE_ANAPHYLAXIS = ["No", "Yes", "Not sure"] as const

export const LIVE_EPIPEN = ["No", "Yes " + EN + " I always carry it", "Yes " + EN + " but not always"] as const

export const LIVE_CONDITIONS = [
  "No",
  "Asthma",
  "Diabetes",
  "Epilepsy or seizures",
  "Heart condition",
  "Fainting or blackouts",
  "Hearing or vision condition that affects safety",
  "I'd rather tell MS Workforce by phone",
  "Other " + EN + " please explain",
] as const

export const LIVE_INJURY = [
  "No",
  "Yes " + EN + " a current injury",
  "Yes " + EN + " a past injury that still affects me",
  "I'd rather tell MS Workforce by phone",
] as const

export const LIVE_TASKS = [
  "Lifting or carrying",
  "Bending or kneeling",
  "Ladders or heights",
  "Standing for long periods",
  "Using hand or power tools",
  "Working in heat",
  "Other " + EN + " please explain",
] as const

export const LIVE_MEDICATION = ["No", "Yes", "I'd rather tell MS Workforce by phone"] as const

export const LIVE_SHARING = [
  "Yes " + EN + " share it with the site supervisor and first aider",
  "Only in an emergency",
  "Other " + EN + " please explain",
] as const

export const LIVE_CONSTRUCTION = ["Yes", "No", "Not sure"] as const

export const LIVE_VERIFICATION = [
  "Sighted original",
  "Photo in portal",
  "Service NSW check",
  "Video call",
] as const

export const LIVE_APPROVER_ROLES = [
  "Site supervisor",
  "Site manager",
  "Foreman / leading hand",
  "Project manager",
  "Owner / director",
  "Office / admin",
  "Other",
] as const

export const LIVE_HEARD = [
  "Google",
  "Referral / word of mouth",
  "LinkedIn",
  "Facebook / Instagram",
  "Saw a worker or ute on site",
  "Other " + EN + " please explain",
  "Other",
] as const

export const LIVE_PLACEMENT_ROLES = [
  "General labourer",
  "Trade assistant",
  "Site clean",
  "Materials handling",
  "Other",
] as const

/** Portal wording to the live choice. Field overrides win when the same words map differently. */
const SHARED: Record<string, string> = {
  "Yes, I have it": "Yes " + EN + " I have it",
  "Other, please explain": "Other " + EN + " please explain",
  "Yes, I can safely do these tasks": "Yes " + EN + " I can safely do these tasks",
  "Yes, with some adjustments (please call me)": "Yes " + EN + " with some adjustments (please call me)",
  "Not sure, please call me": "Not sure " + EN + " please call me",
  "Yes, I always carry it": "Yes " + EN + " I always carry it",
  "Yes, but not always": "Yes " + EN + " but not always",
  "Yes, a current injury": "Yes " + EN + " a current injury",
  "Yes, a past injury that still affects me": "Yes " + EN + " a past injury that still affects me",
  "Yes, share it with the site supervisor and first aider": "Yes " + EN + " share it with the site supervisor and first aider",
  "Foods (e.g. nuts, shellfish)": "Foods (e.g. nuts or shellfish)",
  "Plant ticket (excavator, skid steer, roller)": "Plant ticket (excavator / skid steer / roller)",
}

const FIELD_OVERRIDE: Record<string, Record<string, string>> = {
  "RTW evidence": { "Other, please explain": "Other" },
  "ID sighted method": { "Other, please explain": "Other" },
  "Approver role": { "Other, please explain": "Other" },
  "Heard about us": { "Other, please explain": "Other" },
  "Roles requested": { "Other, please explain": "Other" },
}

export function toLiveOption(value: string, field: string) {
  const override = FIELD_OVERRIDE[field]?.[value]
  if (override) return override
  return SHARED[value] || value
}

export function notionSelect(value: string | undefined, allowed: readonly string[], field: string) {
  if (!value) return { value: undefined as string | undefined, note: undefined as string | undefined }
  const next = toLiveOption(value, field)
  if (allowed.includes(next)) return { value: next, note: undefined }
  return { value: undefined, note: field + ": " + value }
}

export function notionMulti(values: string[] | undefined, allowed: readonly string[], field: string) {
  if (!values?.length) return { values: undefined as string[] | undefined, note: undefined as string | undefined }
  const kept: string[] = []
  const dropped: string[] = []
  for (const value of values) {
    const next = toLiveOption(value, field)
    if (allowed.includes(next)) {
      if (!kept.includes(next)) kept.push(next)
    } else dropped.push(value)
  }
  return {
    values: kept.length ? kept : undefined,
    note: dropped.length ? field + ": " + dropped.join("; ") : undefined,
  }
}

/** Keep only Work days choices that exist. A full week becomes the one live phrase. */
export function notionWorkDays(values: string[] | undefined) {
  if (!values?.length) return { values: undefined as string[] | undefined, note: undefined as string | undefined }
  const chosen = new Set(values)
  const kept: string[] = []
  const allWeek = LIVE_WEEKDAYS.every((day) => chosen.has(day))
  if (allWeek) kept.push("Monday through Sunday")
  if (chosen.has("Short notice OK")) kept.push("Short notice OK")
  const dropped = values.filter((value) => {
    if (value === "Short notice OK") return false
    if (allWeek && (LIVE_WEEKDAYS as readonly string[]).includes(value)) return false
    return true
  })
  return {
    values: kept.length ? kept : undefined,
    note: dropped.length ? "Work days: " + dropped.join("; ") : undefined,
  }
}
