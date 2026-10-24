const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function emailProblem(email: string, confirm: string, required = false): "mismatch" | "format" | null {
  const left = email.trim()
  const right = confirm.trim()
  if (!left && !right) return required ? "format" : null
  if (left.toLowerCase() !== right.toLowerCase()) return "mismatch"
  if (!EMAIL_RE.test(left)) return "format"
  return null
}

export function emailError(problem: "mismatch" | "format" | null) {
  if (problem === "mismatch") return "Emails don't match."
  if (problem === "format") return "That email does not look right."
  return ""
}
