import { sensitiveMessage } from "@/lib/portal/privacy"
import { ALLERGY_TYPES, INJURY_ANSWERS, MEDICAL_CONDITIONS, TASKS_AFFECTED } from "@/lib/portal/types"

export const TELL_BY_PHONE = "I'd rather tell MS Workforce by phone"
export const OTHER_OPTION = "Other, please explain"
export const CURRENT_INJURY = "Yes, a current injury"
export const PAST_INJURY = "Yes, a past injury that still affects me"

export type HealthChoice = "" | "No" | "Yes" | typeof TELL_BY_PHONE

export type HealthDraft = {
  allergies: HealthChoice
  allergyTypes: string[]
  allergyNote: string
  anaphylaxis: string
  epipen: string
  condition: HealthChoice
  conditions: string[]
  conditionNote: string
  injury: HealthChoice
  injuryKind: typeof CURRENT_INJURY | typeof PAST_INJURY
  tasks: string[]
  injuryNote: string
  otherNotes: string
}

export type HealthWorker = {
  allergies?: string
  allergyTypes?: string[]
  anaphylaxis?: string
  epipen?: string
  medicalConditions?: string[]
  injury?: string
  tasksAffected?: string[]
  medicalNotes?: string
}

const CONDITION_OPTIONS = MEDICAL_CONDITIONS.filter((item) => item !== "No" && item !== TELL_BY_PHONE)

export function conditionOptions() {
  return CONDITION_OPTIONS
}

export function yesDetailProblem(picked: string[], note: string): string | null {
  if (picked.length > 0 || note.trim()) return sensitiveMessage(note)
  return "Pick at least one, or describe it in a few words."
}

export function healthSummary(options: string[], note: string) {
  const names = options.filter((item) => item !== OTHER_OPTION)
  const parts = [...names, note.trim()].filter(Boolean)
  if (parts.length) return parts.join(", ")
  return options.includes(OTHER_OPTION) ? OTHER_OPTION : ""
}

function choiceFrom(value: string | undefined, yesValues: readonly string[]): HealthChoice {
  if (value === "No") return "No"
  if (value === TELL_BY_PHONE) return TELL_BY_PHONE
  if (value && (value === "Yes" || yesValues.includes(value))) return "Yes"
  return ""
}

function splitNotes(text?: string) {
  const notes = { allergies: "", condition: "", injury: "", other: "" }
  if (!text?.trim()) return notes
  const other: string[] = []
  for (const line of text.split("\n")) {
    if (line.startsWith("Allergies: ")) notes.allergies = line.slice("Allergies: ".length)
    else if (line.startsWith("Condition: ")) notes.condition = line.slice("Condition: ".length)
    else if (line.startsWith("Injury: ")) notes.injury = line.slice("Injury: ".length)
    else if (line.trim()) other.push(line)
  }
  notes.other = other.join("\n")
  return notes
}

export function joinHealthNotes(notes: { allergies: string; condition: string; injury: string; other: string }) {
  const lines = [
    notes.allergies.trim() ? "Allergies: " + notes.allergies.trim() : "",
    notes.condition.trim() ? "Condition: " + notes.condition.trim() : "",
    notes.injury.trim() ? "Injury: " + notes.injury.trim() : "",
    notes.other.trim(),
  ].filter(Boolean)
  return lines.join("\n")
}

export function storedHealthProblem(worker: HealthWorker): string | null {
  const record = healthRecord(healthFromWorker(worker))
  return record.ok ? null : record.error
}

export function healthFromWorker(worker: HealthWorker): HealthDraft {
  const notes = splitNotes(worker.medicalNotes)
  const conditions = (worker.medicalConditions || []).filter((item) => (CONDITION_OPTIONS as readonly string[]).includes(item))
  const conditionChoice: HealthChoice = conditions.length
    ? "Yes"
    : worker.medicalConditions?.includes(TELL_BY_PHONE)
      ? TELL_BY_PHONE
      : worker.medicalConditions?.includes("No")
        ? "No"
        : ""
  const injuryChoice = choiceFrom(worker.injury, [CURRENT_INJURY, PAST_INJURY])
  const injuryKind = worker.injury === PAST_INJURY ? PAST_INJURY : CURRENT_INJURY
  return {
    allergies: choiceFrom(worker.allergies, ["Yes"]),
    allergyTypes: worker.allergies === "Yes" ? [...(worker.allergyTypes || [])] : [],
    allergyNote: worker.allergies === "Yes" ? notes.allergies : "",
    anaphylaxis: worker.allergies === "Yes" ? worker.anaphylaxis || "" : "",
    epipen: worker.allergies === "Yes" ? worker.epipen || "" : "",
    condition: conditionChoice,
    conditions: conditionChoice === "Yes" ? conditions : [],
    conditionNote: conditionChoice === "Yes" ? notes.condition : "",
    injury: injuryChoice,
    injuryKind,
    tasks: injuryChoice === "Yes" ? [...(worker.tasksAffected || [])] : [],
    injuryNote: injuryChoice === "Yes" ? notes.injury : "",
    otherNotes: notes.other,
  }
}

function listed(picked: string[], note: string) {
  const known = picked.filter((item) => item !== OTHER_OPTION)
  if (known.length) return known
  if (note.trim() || picked.includes(OTHER_OPTION)) return [OTHER_OPTION]
  return []
}

export function healthRecord(draft: HealthDraft):
  | {
      ok: true
      allergies: string
      allergyTypes: string[]
      anaphylaxis: string
      epipen: string
      medicalConditions: string[]
      injury: string
      tasksAffected: string[]
      medicalNotes: string
    }
  | { ok: false; error: string } {
  if (draft.allergies === "Yes") {
    const problem = yesDetailProblem(draft.allergyTypes, draft.allergyNote)
    if (problem) return { ok: false, error: "Allergies: " + problem }
  }
  if (draft.condition === "Yes") {
    const problem = yesDetailProblem(draft.conditions, draft.conditionNote)
    if (problem) return { ok: false, error: "Condition: " + problem }
  }
  if (draft.injury === "Yes") {
    const problem = yesDetailProblem(draft.tasks, draft.injuryNote)
    if (problem) return { ok: false, error: "Injury: " + problem }
    if (!(INJURY_ANSWERS as readonly string[]).includes(draft.injuryKind)) {
      return { ok: false, error: "Injury: Choose current or past." }
    }
  }
  const allergyTypes = draft.allergies === "Yes" ? listed(draft.allergyTypes.filter((item) => (ALLERGY_TYPES as readonly string[]).includes(item)), draft.allergyNote) : []
  const conditions = draft.condition === "Yes" ? listed(draft.conditions.filter((item) => (CONDITION_OPTIONS as readonly string[]).includes(item)), draft.conditionNote) : []
  const tasks = draft.injury === "Yes" ? listed(draft.tasks.filter((item) => (TASKS_AFFECTED as readonly string[]).includes(item)), draft.injuryNote) : []
  return {
    ok: true,
    allergies: draft.allergies,
    allergyTypes,
    anaphylaxis: draft.allergies === "Yes" ? draft.anaphylaxis : "",
    epipen: draft.allergies === "Yes" ? draft.epipen : "",
    medicalConditions: draft.condition === "No" ? ["No"] : draft.condition === TELL_BY_PHONE ? [TELL_BY_PHONE] : conditions,
    injury: draft.injury === "Yes" ? draft.injuryKind : draft.injury,
    tasksAffected: tasks,
    medicalNotes: joinHealthNotes({
      allergies: draft.allergies === "Yes" ? draft.allergyNote : "",
      condition: draft.condition === "Yes" ? draft.conditionNote : "",
      injury: draft.injury === "Yes" ? draft.injuryNote : "",
      other: draft.otherNotes,
    }),
  }
}
