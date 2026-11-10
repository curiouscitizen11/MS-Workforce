import { timingSafeEqual } from "crypto"
import { neon } from "@neondatabase/serverless"
import { portalMode } from "@/lib/portal/config"
import { isThursday, parseCalendarDate } from "@/lib/portal/dates"
import { ensurePortalSchema } from "@/lib/portal/db/migrate"
import { NOTION_DATABASES, type NotionColumn, type NotionDatabaseSpec } from "@/lib/portal/notion/expected"
import { base32Decode } from "@/lib/portal/totp"

export type ReadinessItem = {
  name: string
  required: boolean
  present: boolean
  ok: boolean
  detail: string
}

export type ReadinessReport = {
  mode: "mock" | "live"
  ready: boolean
  checkedAt: string
  config: ReadinessItem[]
  connections: ReadinessItem[]
}

type RemoteProperty = {
  type?: string
  select?: { options?: { name?: string }[] }
  multi_select?: { options?: { name?: string }[] }
}

function item(name: string, required: boolean, present: boolean, ok: boolean, detail: string): ReadinessItem {
  return { name, required, present, ok, detail }
}

function raw(name: string) {
  return process.env[name]?.trim() || ""
}

function safeError(error: unknown) {
  const message = error instanceof Error ? error.message : "could not connect"
  return message.replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted]").replace(/\s+/g, " ").slice(0, 180)
}

export function notionIdOk(value: string) {
  return /^[0-9a-f]{32}$/.test(value.replace(/-/g, "").toLowerCase())
}

function secretItem(name: string) {
  const value = raw(name)
  if (!value) return item(name, true, false, false, "missing")
  if (value.length < 32) return item(name, true, true, false, "shorter than 32 characters")
  return item(name, true, true, true, "set")
}

function totpItem(): ReadinessItem {
  const value = raw("ADMIN_TOTP_SECRET")
  if (!value) return item("ADMIN_TOTP_SECRET", true, false, false, "missing")
  try {
    const bytes = base32Decode(value)
    if (bytes.length < 10) return item("ADMIN_TOTP_SECRET", true, true, false, "base32 secret is too short")
    return item("ADMIN_TOTP_SECRET", true, true, true, "base32")
  } catch {
    return item("ADMIN_TOTP_SECRET", true, true, false, "not base32")
  }
}

function emailShape(value: string) {
  const address = value.match(/<([^>]+)>/)?.[1]?.trim() || value
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)
}

function notionIdItem(spec: NotionDatabaseSpec): ReadinessItem {
  const value = raw(spec.env)
  if (!value) return item(spec.env, spec.required, false, !spec.required, spec.required ? "missing" : spec.note || "not set")
  if (!notionIdOk(value)) return item(spec.env, spec.required, true, false, "expected a 32-character Notion id")
  return item(spec.env, spec.required, true, true, spec.note || "set")
}

function twilioItems(): ReadinessItem[] {
  const fields = [
    { name: "TWILIO_ACCOUNT_SID", value: raw("TWILIO_ACCOUNT_SID"), ok: /^AC[0-9a-f]{32}$/i.test(raw("TWILIO_ACCOUNT_SID")) },
    { name: "TWILIO_AUTH_TOKEN", value: raw("TWILIO_AUTH_TOKEN"), ok: /^[0-9a-f]{32}$/i.test(raw("TWILIO_AUTH_TOKEN")) },
    { name: "TWILIO_FROM", value: raw("TWILIO_FROM"), ok: /^\+[1-9]\d{7,14}$/.test(raw("TWILIO_FROM")) },
  ]
  const any = fields.some((field) => field.value)
  const all = fields.every((field) => field.ok)
  return fields.map((field) => {
    if (!field.value) return item(field.name, false, false, !any, any ? "set all three, or leave all three blank" : "not set")
    if (!field.ok) return item(field.name, false, true, false, "unexpected shape")
    return item(field.name, false, true, all, "set")
  })
}

function payAnchorItem(anchor: string): ReadinessItem {
  if (!anchor) return item("PORTAL_PAY_ANCHOR", false, false, true, "not set, using 2026-11-05")
  const parsed = parseCalendarDate(anchor)
  if (!parsed) return item("PORTAL_PAY_ANCHOR", false, true, false, "expected YYYY-MM-DD")
  if (!isThursday(parsed)) return item("PORTAL_PAY_ANCHOR", false, true, false, "needs to be a Thursday, using 2026-11-05")
  return item("PORTAL_PAY_ANCHOR", false, true, true, "Thursday")
}

export function inspectConfig(): ReadinessItem[] {
  const mode = raw("PORTAL_MODE")
  const site = raw("NEXT_PUBLIC_SITE_URL")
  const anchor = raw("PORTAL_PAY_ANCHOR")
  const adminEmail = raw("ADMIN_EMAIL")
  const adminMobile = raw("ADMIN_MOBILE")
  const blob = raw("BLOB_READ_WRITE_TOKEN")
  const notionEnv = raw("PORTAL_NOTION_ENV")
  const parent = raw("NOTION_PARENT_PAGE_ID")
  const confirm = raw("CONFIRM_CREATE_SHIFT_OFFERS")
  const siteConfirmations = raw("NOTION_SITE_CONFIRMATIONS_DB")
  const resend = raw("RESEND_API_KEY")
  const from = raw("EMAIL_FROM")
  const database = raw("DATABASE_URL")
  const notionToken = raw("NOTION_TOKEN")
  let siteDetail = "missing"
  let siteOk = false
  if (site) {
    try {
      const url = new URL(site)
      if (url.hostname === "localhost" || url.hostname === "127.0.0.1") siteDetail = "still localhost"
      else if (url.protocol === "https:") {
        siteOk = true
        siteDetail = "https"
      } else siteDetail = "not https"
    } catch {
      siteDetail = "not a url"
    }
  }
  return [
    item("PORTAL_MODE", true, Boolean(mode), mode === "live", mode === "live" ? "live" : mode ? "not exactly live" : "missing"),
    item("DATABASE_URL", true, Boolean(database), /^postgres(ql)?:\/\//i.test(database), database ? (/^postgres(ql)?:\/\//i.test(database) ? "postgres url" : "must start with postgres:// or postgresql://") : "missing"),
    item("NOTION_TOKEN", true, Boolean(notionToken), (notionToken.startsWith("ntn_") || notionToken.startsWith("secret_")) && notionToken.length >= 20, notionToken ? ((notionToken.startsWith("ntn_") || notionToken.startsWith("secret_")) && notionToken.length >= 20 ? "set" : "unexpected shape") : "missing"),
    ...NOTION_DATABASES.map(notionIdItem),
    item("NOTION_SITE_CONFIRMATIONS_DB", false, Boolean(siteConfirmations), !siteConfirmations || notionIdOk(siteConfirmations), siteConfirmations ? (notionIdOk(siteConfirmations) ? "not read by the portal" : "expected a 32-character Notion id") : "not read by the portal"),
    item("NOTION_PARENT_PAGE_ID", false, Boolean(parent), !parent || notionIdOk(parent), parent ? (notionIdOk(parent) ? "set" : "expected a 32-character Notion id") : "only needed to create Shift offers"),
    item("PORTAL_NOTION_ENV", false, Boolean(notionEnv), !notionEnv || notionEnv === "test", notionEnv === "test" ? "test" : notionEnv ? "set" : "not set"),
    item("CONFIRM_CREATE_SHIFT_OFFERS", false, Boolean(confirm), true, confirm ? "set" : "not set"),
    item("RESEND_API_KEY", true, Boolean(resend), resend.startsWith("re_") && resend.length >= 12, resend ? (resend.startsWith("re_") && resend.length >= 12 ? "set" : "should start with re_") : "missing"),
    item("EMAIL_FROM", true, Boolean(from), emailShape(from), from ? (emailShape(from) ? "email address" : "not an email address") : "missing"),
    item("ADMIN_EMAIL", false, Boolean(adminEmail), !adminEmail || emailShape(adminEmail), adminEmail ? (emailShape(adminEmail) ? "set" : "not an email address") : "not set, alerts use hello@msworkforce.au"),
    item("ADMIN_MOBILE", false, Boolean(adminMobile), !adminMobile || /^\+[1-9]\d{7,14}$/.test(adminMobile), adminMobile ? (/^\+[1-9]\d{7,14}$/.test(adminMobile) ? "set" : "expected + and country code") : "not set"),
    totpItem(),
    secretItem("PORTAL_SESSION_SECRET"),
    secretItem("PORTAL_ENCRYPTION_KEY"),
    secretItem("PORTAL_SIGNING_SECRET"),
    secretItem("CRON_SECRET"),
    item("BLOB_READ_WRITE_TOKEN", false, Boolean(blob), !blob || blob.startsWith("vercel_blob_rw_"), blob ? (blob.startsWith("vercel_blob_rw_") ? "set" : "unexpected shape") : "not set, photos stay in the database"),
    ...twilioItems(),
    item("NEXT_PUBLIC_SITE_URL", true, Boolean(site), siteOk, siteDetail),
    payAnchorItem(anchor),
  ]
}

export function notionSchemaGaps(columns: NotionColumn[], properties: Record<string, RemoteProperty>) {
  const missing: string[] = []
  const problems: string[] = []
  for (const column of columns) {
    const property = properties[column.name]
    if (!property) {
      missing.push(column.name)
      continue
    }
    if (column.written === false) continue
    if (property.type !== column.type) {
      problems.push(column.name + " is " + (property.type || "unknown") + ", expected " + column.type)
      continue
    }
    if (!column.options || (property.type !== "select" && property.type !== "multi_select")) continue
    const have = new Set((property[property.type]?.options || []).map((option) => option.name).filter((name): name is string => Boolean(name)))
    const absent = column.options.filter((name) => !have.has(name))
    if (absent.length) problems.push(column.name + " missing " + absent.join(", "))
  }
  const coreMissing = columns.filter((column) => column.core && missing.includes(column.name)).map((column) => column.name)
  return { missing, problems, coreMissing }
}

function clip(parts: string[]) {
  const text = parts.filter(Boolean).join(". ")
  return text.length > 700 ? text.slice(0, 680) + "…" : text
}

async function probeDatabase(): Promise<ReadinessItem> {
  const url = raw("DATABASE_URL")
  if (!url) return item("database", true, false, false, "not configured")
  try {
    await ensurePortalSchema(url)
    const sql = neon(url)
    const rows = await sql`select to_regclass('public.portal_records') as name`
    const name = rows[0] && typeof rows[0] === "object" && "name" in rows[0] ? rows[0].name : null
    if (!name) return item("database", true, true, false, "connected, portal_records is missing")
    return item("database", true, true, true, "connected")
  } catch (error) {
    return item("database", true, true, false, safeError(error))
  }
}

async function notionGet(path: string, token: string, fetchImpl: typeof fetch) {
  return fetchImpl("https://api.notion.com/v1" + path, {
    headers: {
      Authorization: "Bearer " + token,
      "Notion-Version": "2022-06-28",
    },
  })
}

async function probeNotion(fetchImpl: typeof fetch): Promise<ReadinessItem[]> {
  const token = raw("NOTION_TOKEN")
  if (!token) {
    return [
      item("notion", true, false, false, "not configured"),
      ...NOTION_DATABASES.map((spec) => item("notion:" + spec.title, spec.required, false, !spec.required, "not configured")),
    ]
  }
  let notion: ReadinessItem
  try {
    const response = await notionGet("/users/me", token, fetchImpl)
    notion = response.ok ? item("notion", true, true, true, "connected") : item("notion", true, true, false, response.status === 401 ? "rejected" : "could not connect")
  } catch {
    notion = item("notion", true, true, false, "could not connect")
  }
  const databases: ReadinessItem[] = []
  for (const spec of NOTION_DATABASES) {
    const id = raw(spec.env)
    if (!id) {
      databases.push(item("notion:" + spec.title, spec.required, false, !spec.required, spec.note || "not configured"))
      continue
    }
    if (!notion.ok) {
      databases.push(item("notion:" + spec.title, spec.required, true, false, "not checked"))
      continue
    }
    try {
      const response = await notionGet("/databases/" + id, token, fetchImpl)
      if (!response.ok) {
        databases.push(item("notion:" + spec.title, spec.required, true, false, response.status === 404 ? "database not found" : "could not open the database"))
        continue
      }
      const body = (await response.json()) as { properties?: Record<string, RemoteProperty> }
      const gaps = notionSchemaGaps(spec.columns, body.properties || {})
      const skipped = gaps.missing.filter((name) => !gaps.coreMissing.includes(name))
      const ok = gaps.coreMissing.length === 0 && gaps.problems.length === 0
      databases.push(
        item(
          "notion:" + spec.title,
          spec.required,
          true,
          ok,
          clip([
            spec.note || "connected",
            gaps.coreMissing.length ? "missing " + gaps.coreMissing.join(", ") : "",
            skipped.length ? "sync skips missing columns: " + skipped.join(", ") : "",
            gaps.problems.join("; "),
          ]),
        ),
      )
    } catch {
      databases.push(item("notion:" + spec.title, spec.required, true, false, "could not open the database"))
    }
  }
  return [notion, ...databases]
}

/** Resend documents this body for a key that may send but cannot list domains. */
export function resendSendOnlyResponse(status: number, body: string): boolean {
  if (status !== 401 && status !== 403) return false
  let name = ""
  let message = body
  try {
    const parsed = JSON.parse(body) as { name?: unknown; message?: unknown }
    if (typeof parsed.name === "string") name = parsed.name
    if (typeof parsed.message === "string") message = parsed.message
  } catch {
    name = ""
  }
  return name === "restricted_api_key" && /restricted to only send emails/i.test(message)
}

async function probeResend(fetchImpl: typeof fetch): Promise<ReadinessItem> {
  const key = raw("RESEND_API_KEY")
  if (!key || !raw("EMAIL_FROM")) return item("resend", true, false, false, "not configured")
  try {
    const response = await fetchImpl("https://api.resend.com/domains", {
      headers: { Authorization: "Bearer " + key },
    })
    if (response.ok) return item("resend", true, true, true, "connected")
    const body = await response.text().catch(() => "")
    if (resendSendOnlyResponse(response.status, body)) {
      return item("resend", true, true, true, "send-only key (sending works)")
    }
    return item("resend", true, true, false, response.status === 401 || response.status === 403 ? "rejected" : "could not connect")
  } catch {
    return item("resend", true, true, false, "could not connect")
  }
}

export function cronAuthorised(header: string | null) {
  const secret = process.env.CRON_SECRET
  if (!secret || !header) return false
  const expected = Buffer.from("Bearer " + secret)
  const given = Buffer.from(header)
  if (expected.length !== given.length) return false
  return timingSafeEqual(expected, given)
}

export async function buildReadinessReport(fetchImpl: typeof fetch = fetch): Promise<ReadinessReport> {
  const config = inspectConfig()
  const connections = [await probeDatabase(), ...(await probeNotion(fetchImpl)), await probeResend(fetchImpl)]
  const ready = [...config, ...connections].every((entry) => !entry.required || entry.ok)
  return { mode: portalMode(), ready, checkedAt: new Date().toISOString(), config, connections }
}
