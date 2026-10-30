import { readFileSync } from "fs"
import { describe, expect, it } from "vitest"
import { THEME, contrastRatio, themeFromCookie } from "@/lib/portal/theme"

const PAIRS = ["text", "muted", "buttonText", "okText", "warnText", "badText"] as const

describe("portal theme", () => {
  it("opens dark unless the cookie says light", () => {
    expect(themeFromCookie(undefined)).toBe("dark")
    expect(themeFromCookie("dark")).toBe("dark")
    expect(themeFromCookie("light")).toBe("light")
  })

  it("keeps body text, secondary text, buttons and status chips at AA contrast", () => {
    for (const mode of ["dark", "light"] as const) {
      const tokens = THEME[mode]
      expect(contrastRatio(tokens.text, tokens.page)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(tokens.text, tokens.card)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(tokens.muted, tokens.page)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(tokens.muted, tokens.card)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(tokens.buttonText, tokens.button)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(tokens.okText, tokens.okBg)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(tokens.warnText, tokens.warnBg)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(tokens.badText, tokens.badBg)).toBeGreaterThanOrEqual(4.5)
      for (const key of PAIRS) expect(tokens[key]).toMatch(/^#[0-9A-F]{6}$/)
    }
  })

  it("uses the same colours in the portal stylesheet", () => {
    const css = readFileSync("app/globals.css", "utf8").toLowerCase()
    for (const mode of ["dark", "light"] as const) {
      for (const hex of Object.values(THEME[mode])) expect(css).toContain(hex.toLowerCase())
    }
  })
})
