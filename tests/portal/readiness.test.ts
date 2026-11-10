import { afterEach, describe, expect, it, vi } from "vitest"
import { PLACEMENT_PROPERTIES } from "@/lib/portal/book-labour"
import { PLACEMENT_COLUMN_NAMES } from "@/lib/portal/notion/expected"
import { buildReadinessReport, cronAuthorised, inspectConfig, notionSchemaGaps, resendSendOnlyResponse } from "@/lib/portal/readiness"
import { TIMESHEET_COLUMNS, WORKER_COLUMNS } from "@/lib/portal/notion/expected"

afterEach(() => {
  vi.unstubAllEnvs()
})

const SECRET_NAMES = [
  "PORTAL_MODE",
  "DATABASE_URL",
  "NOTION_TOKEN",
  "NOTION_WORKERS_DB",
  "NOTION_PLACEMENTS_DB",
  "NOTION_TIMESHEETS_DB",
  "NOTION_INDUCTION_DB",
  "NOTION_SHIFT_OFFERS_DB",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "ADMIN_TOTP_SECRET",
  "PORTAL_SESSION_SECRET",
  "PORTAL_ENCRYPTION_KEY",
  "PORTAL_SIGNING_SECRET",
  "CRON_SECRET",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_FROM",
  "BLOB_READ_WRITE_TOKEN",
  "NEXT_PUBLIC_SITE_URL",
  "ADMIN_EMAIL",
  "ADMIN_MOBILE",
]

describe("readiness", () => {
  it("lists every live setting without echoing values", () => {
    for (const name of SECRET_NAMES) vi.stubEnv(name, "")
    vi.stubEnv("RESEND_API_KEY", "re_supersecretvalue")
    vi.stubEnv("DATABASE_URL", "postgres://user:password@localhost/db")
    vi.stubEnv("PORTAL_SESSION_SECRET", "b".repeat(40))
    vi.stubEnv("PORTAL_ENCRYPTION_KEY", "c".repeat(32))
    vi.stubEnv("EMAIL_FROM", "MS Workforce <portal@msworkforce.au>")
    vi.stubEnv("TWILIO_ACCOUNT_SID", "")
    const report = JSON.stringify(inspectConfig())
    expect(report).not.toContain("supersecret")
    expect(report).not.toContain("password")
    expect(report).not.toContain("b".repeat(40))
    expect(report).not.toContain("portal@msworkforce.au")
    const items = inspectConfig()
    expect(items.find((entry) => entry.name === "RESEND_API_KEY")?.ok).toBe(true)
    expect(items.find((entry) => entry.name === "EMAIL_FROM")?.detail).toBe("email address")
    expect(items.find((entry) => entry.name === "PORTAL_ENCRYPTION_KEY")?.detail).toBe("set")
    expect(items.find((entry) => entry.name === "TWILIO_ACCOUNT_SID")?.required).toBe(false)
    expect(items.find((entry) => entry.name === "TWILIO_ACCOUNT_SID")?.ok).toBe(true)
    expect(items.find((entry) => entry.name === "NOTION_INDUCTION_DB")?.required).toBe(false)
    expect(items.find((entry) => entry.name === "DATABASE_URL")?.ok).toBe(true)
  })

  it("rejects a short secret and a non-base32 authenticator secret", () => {
    for (const name of SECRET_NAMES) vi.stubEnv(name, "")
    vi.stubEnv("PORTAL_SIGNING_SECRET", "too-short")
    vi.stubEnv("ADMIN_TOTP_SECRET", "not base32 !!!")
    const items = inspectConfig()
    expect(items.find((entry) => entry.name === "PORTAL_SIGNING_SECRET")?.detail).toBe("shorter than 32 characters")
    expect(items.find((entry) => entry.name === "ADMIN_TOTP_SECRET")?.detail).toBe("not base32")
    vi.stubEnv("ADMIN_TOTP_SECRET", "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ")
    expect(inspectConfig().find((entry) => entry.name === "ADMIN_TOTP_SECRET")?.detail).toBe("base32")
  })

  it("checks Notion columns and options without a network call", () => {
    const gaps = notionSchemaGaps(WORKER_COLUMNS, {
      Name: { type: "title" },
      Mobile: { type: "phone_number" },
      Email: { type: "email" },
      Status: { type: "select", select: { options: [{ name: "Ready" }] } },
    })
    expect(gaps.coreMissing).toEqual([])
    expect(gaps.problems.some((problem) => problem.startsWith("Status missing"))).toBe(true)
    expect(gaps.missing).toContain("Suburb")
    const renamed = notionSchemaGaps(TIMESHEET_COLUMNS, { "Pay fortnight": { type: "rich_text" }, Entry: { type: "title" } })
    expect(renamed.missing).not.toContain("Pay week")
    expect(renamed.notes).toContain("Pay week is still called Pay fortnight")
    expect(renamed.problems).toEqual([])
    const named = notionSchemaGaps(TIMESHEET_COLUMNS, { "Pay week": { type: "rich_text" } })
    expect(named.missing).not.toContain("Pay week")
    expect(named.notes).toEqual([])
    const absent = notionSchemaGaps(TIMESHEET_COLUMNS, {})
    expect(absent.missing).toContain("Pay week")
    const wrong = notionSchemaGaps(TIMESHEET_COLUMNS, { "Pay fortnight": { type: "select" } })
    expect(wrong.problems.some((problem) => problem.startsWith("Pay fortnight is select"))).toBe(true)
    expect(PLACEMENT_COLUMN_NAMES.slice().sort()).toEqual([...PLACEMENT_PROPERTIES].slice().sort())
  })

  it("reports missing connections and does not call them when nothing is configured", async () => {
    for (const name of SECRET_NAMES) vi.stubEnv(name, "")
    const calls: string[] = []
    const report = await buildReadinessReport(async (url) => {
      calls.push(String(url))
      return new Response("no", { status: 500 })
    })
    expect(calls).toEqual([])
    expect(report.ready).toBe(false)
    expect(report.connections.find((entry) => entry.name === "database")?.detail).toBe("not configured")
    expect(report.connections.find((entry) => entry.name === "notion")?.detail).toBe("not configured")
    expect(report.connections.find((entry) => entry.name === "resend")?.detail).toBe("not configured")
    expect(JSON.stringify(report)).not.toContain("postgres://")
  })

  it("treats Resend's sending-only key error as healthy and rejects an invalid key", async () => {
    const sendOnly = JSON.stringify({
      statusCode: 401,
      name: "restricted_api_key",
      message: "This API key is restricted to only send emails.",
    })
    expect(resendSendOnlyResponse(401, sendOnly)).toBe(true)
    expect(resendSendOnlyResponse(403, sendOnly)).toBe(true)
    expect(resendSendOnlyResponse(401, JSON.stringify({ statusCode: 401, name: "validation_error", message: "API key is invalid" }))).toBe(false)
    expect(resendSendOnlyResponse(403, JSON.stringify({ statusCode: 403, name: "restricted_api_key", message: "API key is not active" }))).toBe(false)

    for (const name of SECRET_NAMES) vi.stubEnv(name, "")
    vi.stubEnv("RESEND_API_KEY", "re_sendonlykeyvalue")
    vi.stubEnv("EMAIL_FROM", "portal@msworkforce.au")
    const calls: string[] = []
    const healthy = await buildReadinessReport(async (url, init) => {
      calls.push((init?.method || "GET") + " " + String(url))
      return new Response(sendOnly, { status: 401, headers: { "content-type": "application/json" } })
    })
    expect(calls).toEqual(["GET https://api.resend.com/domains"])
    expect(healthy.connections.find((entry) => entry.name === "resend")).toMatchObject({
      ok: true,
      detail: "send-only key (sending works)",
    })
    expect(JSON.stringify(healthy)).not.toContain("re_sendonlykeyvalue")

    const rejected = await buildReadinessReport(async () => {
      return new Response(JSON.stringify({ name: "validation_error", message: "API key is invalid" }), { status: 401 })
    })
    expect(rejected.connections.find((entry) => entry.name === "resend")?.ok).toBe(false)
    expect(rejected.connections.find((entry) => entry.name === "resend")?.detail).toBe("rejected")
  })

  it("accepts a Thursday pay anchor and ignores any other weekday", () => {
    vi.stubEnv("PORTAL_PAY_ANCHOR", "2026-11-05")
    expect(inspectConfig().find((entry) => entry.name === "PORTAL_PAY_ANCHOR")).toMatchObject({ ok: true, detail: "Thursday" })
    vi.stubEnv("PORTAL_PAY_ANCHOR", "2026-11-04")
    expect(inspectConfig().find((entry) => entry.name === "PORTAL_PAY_ANCHOR")).toMatchObject({
      ok: false,
      detail: "needs to be a Thursday, using 2026-11-05",
    })
    vi.stubEnv("PORTAL_PAY_ANCHOR", "not-a-date")
    expect(inspectConfig().find((entry) => entry.name === "PORTAL_PAY_ANCHOR")?.detail).toBe("expected YYYY-MM-DD")
  })

  it("accepts the cron secret and nothing else", () => {
    vi.stubEnv("CRON_SECRET", "d".repeat(40))
    expect(cronAuthorised("Bearer " + "d".repeat(40))).toBe(true)
    expect(cronAuthorised("Bearer " + "e".repeat(40))).toBe(false)
    expect(cronAuthorised(null)).toBe(false)
    vi.stubEnv("CRON_SECRET", "")
    expect(cronAuthorised("Bearer " + "d".repeat(40))).toBe(false)
  })
})
