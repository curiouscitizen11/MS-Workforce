export function firstIncompleteOnboardingStep(worker: {
  onboardingSubmitted?: string
  dob?: string
  address?: string
  emergencyContact?: string
  emergencyPhone?: string
  rtw?: string
  experienceLevel?: string
  availableFrom?: string
  fitness?: string
  healthConsent?: boolean
  policiesAck?: boolean
  signaturePng?: string
}) {
  if (worker.onboardingSubmitted) return 6
  if (!worker.dob || !worker.address || !worker.emergencyContact || !worker.emergencyPhone) return 0
  if (!worker.rtw) return 1
  if (!worker.experienceLevel && !worker.availableFrom) return 2
  if (!worker.fitness && !worker.healthConsent) return 4
  if (!worker.policiesAck && !worker.signaturePng) return 5
  return 6
}
