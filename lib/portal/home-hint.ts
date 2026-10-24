export const HOME_HINT_KEY = "msw-add-home-dismissed"

export function shouldShowAddHomeHint(
  userAgent: string,
  input: { dismissed: boolean; standalone: boolean },
): boolean {
  if (input.dismissed || input.standalone) return false
  if (!/iPhone/.test(userAgent)) return false
  if (/CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent)) return false
  return /Safari/.test(userAgent)
}
