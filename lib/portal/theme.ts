export const THEME_COOKIE = "msw_theme"

export type PortalTheme = "dark" | "light"

export const THEME = {
  dark: {
    page: "#0A1A2F",
    card: "#132B47",
    text: "#E8EEF4",
    muted: "#D5E2EF",
    button: "#33BFAF",
    buttonText: "#0A2540",
    accent: "#7DDBC8",
    okBg: "#14532D",
    okText: "#DCFCE7",
    warnBg: "#78350F",
    warnText: "#FEF3C7",
    badBg: "#7F1D1D",
    badText: "#FEE2E2",
    border: "#1F6F66",
  },
  light: {
    page: "#EEF3F7",
    card: "#FFFFFF",
    text: "#0A2540",
    muted: "#3E5166",
    button: "#33BFAF",
    buttonText: "#0A2540",
    accent: "#0F766E",
    okBg: "#DCFCE7",
    okText: "#166534",
    warnBg: "#FEF3C7",
    warnText: "#9A3412",
    badBg: "#FEE2E2",
    badText: "#991B1B",
    border: "#D5DEE8",
  },
} as const

export function themeFromCookie(value: string | undefined): PortalTheme {
  return value === "light" ? "light" : "dark"
}

function channel(value: number) {
  const scaled = value / 255
  return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4
}

export function luminance(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16)
  const r = channel((n >> 16) & 255)
  const g = channel((n >> 8) & 255)
  const b = channel(n & 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a: string, b: string) {
  const left = luminance(a)
  const right = luminance(b)
  const lighter = Math.max(left, right)
  const darker = Math.min(left, right)
  return (lighter + 0.05) / (darker + 0.05)
}
