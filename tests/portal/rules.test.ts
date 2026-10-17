import { describe, expect, it } from "vitest"
import { portalMode, sessionSecret, signingSecret } from "@/lib/portal/config"
import { assessTickets, canAcceptShift, dueReminderStage, type TicketInput } from "@/lib/portal/compliance"
import { encryptString } from "@/lib/portal/crypto"
import { createMemoryStore } from "@/lib/portal/store"
import { sydneyToday } from "@/lib/portal/dates"
import { signedFilePath, stripJpegExif, verifyFileToken } from "@/lib/portal/files"
import { formatHours, hoursWarnings, onQuarterHour, paidHours } from "@/lib/portal/hours"
import { payFortnight, sydneyInstant, xeroCsv } from "@/lib/portal/pay"
import { QUESTIONS, scoreAnswers } from "@/lib/portal/induction"
import { toNotionProperties } from "@/lib/portal/notion/map"
import { sensitiveFindings } from "@/lib/portal/privacy"
import { retryAfterMs, createRateGate } from "@/lib/portal/rate-limit"
import { totpCode, verifyTotp } from "@/lib/portal/totp"
import type { TicketType } from "@/lib/portal/types"

const DAY = "2026-10-17"

function tickets(overrides: Partial<Record<TicketType, { status?: string; expiry?: string | null }>> = {}): TicketInput[] {
  const base: TicketInput[] = [
    { type: "whiteCard", status: "Held" },
    { type: "heights", status: "Not held" },
    { type: "asbestosA", status: "Not held" },
    { type: "asbestosB", status: "Not held" },
    { type: "confinedSpace", status: "Not held" },
    { type: "firstAid", status: "Not held" },
    { type: "driverLicence", status: "Not held" },
    { type: "other", status: "Not held" },
  ]
  return base.map((ticket) => ({ ...ticket, ...overrides[ticket.type] }))
}

describe("booking blocks and warning windows", () => {
  const cases: Array<{ name: string; tickets: TicketInput[]; badge: string }> = [
    { name: "white card blank", tickets: tickets({ whiteCard: { status: "" } }), badge: "do-not-book" },
    { name: "white card not held", tickets: tickets({ whiteCard: { status: "Not held" } }), badge: "do-not-book" },
    { name: "white card marked expired", tickets: tickets({ whiteCard: { status: "Expired" } }), badge: "do-not-book" },
    { name: "white card date past", tickets: tickets({ whiteCard: { status: "Held", expiry: "2026-10-16" } }), badge: "do-not-book" },
    { name: "white card held with no expiry", tickets: tickets(), badge: "ok" },
    { name: "white card expires today", tickets: tickets({ whiteCard: { status: "Held", expiry: DAY } }), badge: "warning" },
    { name: "white card inside 30 days", tickets: tickets({ whiteCard: { status: "Held", expiry: "2026-11-16" } }), badge: "warning" },
    { name: "white card outside 30 days", tickets: tickets({ whiteCard: { status: "Held", expiry: "2026-11-17" } }), badge: "ok" },
    { name: "asbestos A marked expired", tickets: tickets({ asbestosA: { status: "Expired" } }), badge: "do-not-book" },
    { name: "asbestos A date past", tickets: tickets({ asbestosA: { status: "Held", expiry: "2026-10-16" } }), badge: "do-not-book" },
    { name: "asbestos A not held", tickets: tickets({ asbestosA: { status: "Not held" } }), badge: "ok" },
    { name: "asbestos B marked expired", tickets: tickets({ asbestosB: { status: "Expired" } }), badge: "do-not-book" },
    { name: "asbestos B inside 60 days", tickets: tickets({ asbestosB: { status: "Held", expiry: "2026-12-16" } }), badge: "warning" },
    { name: "asbestos B outside 60 days", tickets: tickets({ asbestosB: { status: "Held", expiry: "2026-12-17" } }), badge: "ok" },
    { name: "first aid in 59 days", tickets: tickets({ firstAid: { status: "Held", expiry: "2026-12-15" } }), badge: "warning" },
    { name: "first aid in 60 days", tickets: tickets({ firstAid: { status: "Held", expiry: "2026-12-16" } }), badge: "warning" },
    { name: "first aid in 61 days", tickets: tickets({ firstAid: { status: "Held", expiry: "2026-12-17" } }), badge: "ok" },
    { name: "first aid date past", tickets: tickets({ firstAid: { status: "Held", expiry: "2026-10-16" } }), badge: "restricted" },
    { name: "heights in 31 days", tickets: tickets({ heights: { status: "Held", expiry: "2026-11-17" } }), badge: "ok" },
    { name: "heights in 30 days", tickets: tickets({ heights: { status: "Held", expiry: "2026-11-16" } }), badge: "warning" },
    { name: "heights marked expired", tickets: tickets({ heights: { status: "Expired" } }), badge: "restricted" },
    { name: "heights date past", tickets: tickets({ heights: { status: "Held", expiry: "2026-10-01" } }), badge: "restricted" },
    { name: "confined space expired", tickets: tickets({ confinedSpace: { status: "Expired" } }), badge: "restricted" },
    { name: "driver marked expired", tickets: tickets({ driverLicence: { status: "Expired" } }), badge: "restricted" },
    { name: "driver date past", tickets: tickets({ driverLicence: { status: "Car", expiry: "2026-10-01" } }), badge: "restricted" },
    { name: "driver inside 30 days", tickets: tickets({ driverLicence: { status: "Car", expiry: "2026-11-16" } }), badge: "warning" },
    { name: "other ticket date past", tickets: tickets({ other: { status: "Held", expiry: "2026-10-01" } }), badge: "restricted" },
    {
      name: "do not book wins over restricted",
      tickets: tickets({ whiteCard: { status: "Not held" }, heights: { status: "Expired" } }),
      badge: "do-not-book",
    },
  ]

  it.each(cases)("$name", ({ tickets: rows, badge }) => {
    const result = assessTickets(rows, DAY)
    expect(result.badge).toBe(badge)
    if (badge === "restricted") expect(result.label).toBe("Restricted – check before booking")
    if (badge === "do-not-book") expect(result.label).toBe("DO NOT BOOK")
    if (badge === "warning") expect(result.label).toBe("Expiring soon")
  })

  it("blocks a do-not-book worker and a missing required ticket", () => {
    const blocked = canAcceptShift({ tickets: tickets({ whiteCard: { status: "Expired" } }), jobDate: DAY, required: ["whiteCard"] })
    expect(blocked.ok).toBe(false)
    const missing = canAcceptShift({ tickets: tickets(), jobDate: DAY, required: ["heights"] })
    expect(missing.ok).toBe(false)
    if (!missing.ok) expect(missing.message).toContain("Work at heights")
  })

  it("allows a warning, and a restricted worker when the required tickets are valid", () => {
    const warning = canAcceptShift({
      tickets: tickets({ heights: { status: "Held", expiry: "2026-11-01" } }),
      jobDate: DAY,
      required: ["whiteCard"],
    })
    expect(warning.ok).toBe(true)
    const restricted = canAcceptShift({
      tickets: tickets({ heights: { status: "Expired" } }),
      jobDate: DAY,
      required: ["whiteCard"],
    })
    expect(restricted.ok).toBe(true)
    const requiredExpired = canAcceptShift({
      tickets: tickets({ heights: { status: "Held", expiry: "2026-10-16" } }),
      jobDate: "2026-10-20",
      required: ["heights"],
    })
    expect(requiredExpired.ok).toBe(false)
    const validOnTheDay = canAcceptShift({
      tickets: tickets({ heights: { status: "Held", expiry: "2026-10-20" } }),
      jobDate: "2026-10-20",
      required: ["heights"],
    })
    expect(validOnTheDay.ok).toBe(true)
  })

  it("uses the Sydney date", () => {
    expect(sydneyToday(new Date("2026-10-16T14:30:00Z"))).toBe("2026-10-17")
    expect(sydneyToday(new Date("2026-10-16T12:00:00Z"))).toBe("2026-10-16")
  })

  it("sends the first-aid reminder inside 60 days and waits until 30 for heights", () => {
    expect(dueReminderStage(59, 60, [])).toBe("window")
    expect(dueReminderStage(31, 30, [])).toBeNull()
    expect(dueReminderStage(30, 30, [])).toBe("window")
    expect(dueReminderStage(14, 60, ["window"])).toBe("14")
    expect(dueReminderStage(0, 30, ["window", "14", "7"])).toBe("0")
  })
})

describe("hours, privacy, induction and file links", () => {
  it("counts 07:00–15:30 with a 30 minute break as 8 hours", () => {
    const result = paidHours("07:00", "15:30", 30)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.hours).toBe(8)
      expect(formatHours(result.hours)).toBe("8.0")
      expect(hoursWarnings(result.hours)).toEqual([])
    }
    expect(paidHours("15:30", "07:00", 0).ok).toBe(false)
    expect(onQuarterHour("07:00")).toBe(true)
    expect(onQuarterHour("07:10")).toBe(false)
    expect(hoursWarnings(10.5)[0]?.level).toBe("warn")
    expect(hoursWarnings(12.5)[0]?.level).toBe("confirm")
    expect(hoursWarnings(3.5)[0]?.level).toBe("confirm")
    expect(hoursWarnings(1.5)).toHaveLength(1)
  })

  it("keeps 5:59 pm on the cut-off Wednesday and rolls 6:01 pm to the next fortnight", () => {
    const early = payFortnight(sydneyInstant("2026-11-18", "17:59"))
    expect(early).toMatchObject({ start: "2026-11-05", end: "2026-11-18", payDay: "2026-11-19", afterCutoff: false })
    const late = payFortnight(sydneyInstant("2026-11-18", "18:01"))
    expect(late).toMatchObject({ start: "2026-11-19", end: "2026-12-02", payDay: "2026-12-03", afterCutoff: true })
    const midweek = payFortnight(sydneyInstant("2026-11-11", "18:01"))
    expect(midweek).toMatchObject({ start: "2026-11-05", end: "2026-11-18", afterCutoff: false })
    const csv = xeroCsv([{ employee: "Sam Lee", date: "2026-11-05", start: "07:00", finish: "15:30", breakMinutes: 30, hours: 8 }])
    expect(csv.split("\n")[0]).toBe("employee,date,start,finish,break,hours")
    expect(csv).toContain("Sam Lee,2026-11-05,07:00,15:30,30,8")
  })

  it("rejects tax file and bank details in free text", () => {
    expect(sensitiveFindings("My TFN is 123456789")).toContain("tfn")
    expect(sensitiveFindings("BSB 062-000")).toContain("bsb")
    expect(sensitiveFindings("bank account later")).toContain("bank-or-super")
    expect(sensitiveFindings("Call me on 0400111222")).toEqual([])
  })

  it("scores the induction the same way as the live quiz", () => {
    const correct = QUESTIONS.map((question) => question.correctIndex)
    expect(scoreAnswers(correct).pass).toBe(true)
    const q2Wrong = [...correct]
    q2Wrong[1] = correct[1] === 0 ? 1 : 0
    expect(scoreAnswers(q2Wrong).pass).toBe(false)
    const q3q5 = [...correct]
    q3q5[2] = correct[2] === 0 ? 1 : 0
    q3q5[4] = correct[4] === 0 ? 1 : 0
    expect(scoreAnswers(q3q5).pass).toBe(false)
    expect(scoreAnswers(q3q5).critical).toBe(3)
    const q8 = [...correct]
    q8[7] = correct[7] === 0 ? 1 : 0
    expect(scoreAnswers(q8).pass).toBe(true)
    expect(scoreAnswers(q8).score).toBe(7)
  })

  it("expires signed file links after five minutes", () => {
    const now = Date.parse("2026-10-17T00:00:00Z")
    const path = signedFilePath("doc-1", now, "secret", 600)
    const exp = Number(new URL("http://localhost" + path).searchParams.get("exp"))
    expect(exp - now / 1000).toBeLessThanOrEqual(300)
    const sig = new URL("http://localhost" + path).searchParams.get("sig") || ""
    expect(verifyFileToken("doc-1", exp, sig, "secret", now + 60_000)).toBe(true)
    expect(verifyFileToken("doc-1", exp, sig, "secret", now + 301_000)).toBe(false)
    expect(verifyFileToken("doc-1", exp, "nope", "secret", now)).toBe(false)
  })

  it("strips JPEG location data", () => {
    const app1 = Buffer.from([0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00])
    const input = Buffer.concat([Buffer.from([0xff, 0xd8]), app1, Buffer.from([0xff, 0xd9])])
    const output = stripJpegExif(input)
    expect(output.includes(Buffer.from([0xff, 0xe1]))).toBe(false)
    expect(output[0]).toBe(0xff)
    expect(output[1]).toBe(0xd8)
  })

  it("waits for Notion Retry-After and spaces requests", async () => {
    expect(retryAfterMs(429, "2")).toBe(2000)
    expect(retryAfterMs(200, "2")).toBeNull()
    const gate = createRateGate(500)
    const slept: number[] = []
    await gate(1000, async (ms) => {
      slept.push(ms)
    })
    await gate(1000, async (ms) => {
      slept.push(ms)
    })
    expect(slept).toEqual([500])
  })

  it("matches the authenticator test vector", () => {
    const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"
    expect(totpCode(secret, 59_000)).toBe("287082")
    expect(verifyTotp("287082", secret, 59_000)).toBe(true)
    expect(verifyTotp("000000", secret, 59_000)).toBe(false)
  })
})

describe("preview starts with no secrets", () => {
  const keys = [
    "PORTAL_MODE",
    "VERCEL_ENV",
    "DATABASE_URL",
    "NOTION_TOKEN",
    "PORTAL_SESSION_SECRET",
    "PORTAL_SIGNING_SECRET",
    "PORTAL_ENCRYPTION_KEY",
    "ADMIN_TOTP_SECRET",
  ]

  function withEnv(values: Record<string, string | undefined>, run: () => void) {
    const saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]))
    for (const key of keys) delete process.env[key]
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    try {
      run()
    } finally {
      for (const key of keys) {
        if (saved[key] === undefined) delete process.env[key]
        else process.env[key] = saved[key]
      }
    }
  }

  it("stays in demo mode on a preview even when live keys are present", () => {
    withEnv({ VERCEL_ENV: "preview", DATABASE_URL: "postgres://example", NOTION_TOKEN: "ntn" }, () => {
      expect(portalMode()).toBe("mock")
      expect(sessionSecret()).toBe("mock-only-session-secret")
      expect(signingSecret()).toBe("mock-only-signing-secret")
      expect(encryptString("passport").length).toBeGreaterThan(20)
    })
  })

  it("uses demo mode when the database and Notion are not configured", () => {
    withEnv({}, () => {
      expect(portalMode()).toBe("mock")
      expect(() => sessionSecret()).not.toThrow()
    })
  })

  it("fails only when live mode is missing a secret", () => {
    withEnv({ PORTAL_MODE: "live", VERCEL_ENV: "preview" }, () => {
      expect(portalMode()).toBe("live")
      expect(() => sessionSecret()).toThrow(/PORTAL_SESSION_SECRET is required when the portal is live/)
      expect(() => encryptString("passport")).toThrow(/PORTAL_ENCRYPTION_KEY/)
    })
  })

  it("keeps the demo running when the disk is read-only", async () => {
    const { mkdtempSync, writeFileSync } = await import("fs")
    const { tmpdir } = await import("os")
    const { join } = await import("path")
    const dir = mkdtempSync(join(tmpdir(), "msw-ro-"))
    const blocker = join(dir, "not-a-directory")
    writeFileSync(blocker, "x")
    const store = createMemoryStore({ seed: true, persistPath: join(blocker, "store.json") })
    const workers = await store.workers.all()
    expect(workers.length).toBeGreaterThan(0)
    await store.workers.save(workers[0])
    expect((await store.workers.get(workers[0].id))?.name).toBe(workers[0].name)
  })
})

describe("Notion writes", () => {
  it("formats worker fields and leaves passport out", () => {
    const properties = toNotionProperties({
      Name: "Sam Lee",
      Mobile: "+61400111222",
      Status: "Ready",
      "WhatsApp OK": true,
      "Induction score": 8,
      "White card expiry": "2027-01-01",
    })
    expect(properties.Name).toEqual({ title: [{ type: "text", text: { content: "Sam Lee" } }] })
    expect(properties.Mobile).toEqual({ phone_number: "+61400111222" })
    expect(properties.Status).toEqual({ select: { name: "Ready" } })
    expect(properties["WhatsApp OK"]).toEqual({ checkbox: true })
    expect(properties["Induction score"]).toEqual({ number: 8 })
    expect(Object.keys(properties).join(" ")).not.toMatch(/passport|tfn|bank|super/i)
  })
})
