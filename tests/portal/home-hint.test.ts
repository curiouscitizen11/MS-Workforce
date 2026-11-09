import { describe, expect, it } from "vitest"
import { shouldShowAddHomeHint } from "@/lib/portal/home-hint"

const SAFARI = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
const CHROME = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/119.0.6045.109 Mobile/15E148 Safari/604.1"

describe("add to home screen hint", () => {
  it("shows only in iPhone Safari, and stays hidden once dismissed or installed", () => {
    expect(shouldShowAddHomeHint(SAFARI, { dismissed: false, standalone: false })).toBe(true)
    expect(shouldShowAddHomeHint(SAFARI, { dismissed: true, standalone: false })).toBe(false)
    expect(shouldShowAddHomeHint(SAFARI, { dismissed: false, standalone: true })).toBe(false)
    expect(shouldShowAddHomeHint(CHROME, { dismissed: false, standalone: false })).toBe(false)
    expect(shouldShowAddHomeHint("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15", { dismissed: false, standalone: false })).toBe(false)
  })
})