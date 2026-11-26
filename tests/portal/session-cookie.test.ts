import { describe, expect, it } from "vitest"
import { cookieIsSecure } from "@/lib/portal/session"

describe("sign-in cookie security", () => {
  it("stays off Secure for localhost HTTP so Safari can keep the cookie", () => {
    expect(cookieIsSecure({ host: "localhost:4173", production: true })).toBe(false)
    expect(cookieIsSecure({ host: "127.0.0.1:4173", forwardedProto: "http", production: true })).toBe(false)
    expect(cookieIsSecure({ host: "[::1]:4173", production: true })).toBe(false)
  })

  it("uses Secure on a real HTTPS host and on production when the proto is missing", () => {
    expect(cookieIsSecure({ host: "www.msworkforce.au", forwardedProto: "https", production: true })).toBe(true)
    expect(cookieIsSecure({ host: "www.msworkforce.au", forwardedProto: "https,http", production: true })).toBe(true)
    expect(cookieIsSecure({ host: "www.msworkforce.au", production: true })).toBe(true)
    expect(cookieIsSecure({ host: "www.msworkforce.au", forwardedProto: "http", production: true })).toBe(false)
    expect(cookieIsSecure({ host: "www.msworkforce.au", production: false })).toBe(false)
  })
})
