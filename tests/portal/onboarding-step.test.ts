import { describe, expect, it } from "vitest"
import { firstIncompleteOnboardingStep } from "@/lib/portal/onboarding-step"

const details = {
  dob: "2000-01-02",
  address: "1 Example St",
  emergencyContact: "Pat Example",
  emergencyPhone: "0400 000 010",
}

describe("onboarding resume", () => {
  it("opens a new person on the first step", () => {
    expect(firstIncompleteOnboardingStep({})).toBe(0)
  })

  it("opens a half-finished person on the next unfinished step", () => {
    expect(firstIncompleteOnboardingStep({ ...details, rtw: "Australian citizen" })).toBe(2)
    expect(
      firstIncompleteOnboardingStep({
        ...details,
        rtw: "Australian citizen",
        experienceLevel: "Some",
        availableFrom: "2026-11-01",
      }),
    ).toBe(4)
  })

  it("opens a finished person on the last step", () => {
    expect(firstIncompleteOnboardingStep({ ...details, onboardingSubmitted: "2026-10-17" })).toBe(6)
  })
})
