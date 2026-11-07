import { sensitiveMessage } from "@/lib/portal/privacy"

export const WORK_DONE_MAX = 200

/** Old timesheets stored task chips. New ones store one short sentence in the same field. */
export function workDoneText(tasks: string | string[] | null | undefined, taskNote?: string | null): string {
  const chips = Array.isArray(tasks) ? tasks.filter((item) => item && item !== "Other, please explain") : []
  const base = (Array.isArray(tasks) ? chips.join(", ") : tasks || "").trim()
  const note = (taskNote || "").trim()
  const text = note && note !== "Other, please explain" && !base.includes(note) ? [base, note].filter(Boolean).join(". ") : base
  return text.slice(0, WORK_DONE_MAX)
}

export function workDoneProblem(text: string): string | null {
  const value = text.trim()
  if (!value) return "Say what you did today."
  if (value.length > WORK_DONE_MAX) return "Keep it to 200 characters."
  return sensitiveMessage(value)
}
