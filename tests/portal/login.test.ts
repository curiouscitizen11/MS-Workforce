import { describe, expect, it } from "vitest"
import { ADMIN_SESSION_MS, WORKER_SESSION_MS, adminTotpSecret } from "@/lib/portal/config"
import { portalHome } from "@/lib/portal/home"
import { createNotify } from "@/lib/portal/notify"
import { renewWorkerSession, requestOtp, verifyOtp, confirmAdminTotp, loginSms, type Ctx } from "@/lib/portal/services"
import { createMemoryStore } from "@/lib/portal/store"
import { totpCode } from "@/lib/portal/totp"

function harness(now = new Date("2026-10-17T01:00:00.000Z")) {
  const store = createMemoryStore({ seed: true, now })
  const notify = createNotify(store, "mock", async () => {
    throw new Error("network")
  })
  const ctx: Ctx = { store, now, mode: "mock", notify }
  return { ctx }
}

describe("fast login", () => {
  it("renews a worker session for 30 days and sends a code phones can autofill", async () => {
    const { ctx } = harness()
    const sent = await requestOtp(ctx, { mobile: "0400 111 222", ip: "local" })
    expect(sent.ok).toBe(true)
    if (!sent.ok || !sent.devCode) throw new Error("missing code")
    const notes = await ctx.store.notifications.all()
    expect(notes.map((item) => item.body).join("\n")).toBe("Login code sent")
    expect(loginSms(sent.devCode).startsWith(sent.devCode)).toBe(true)
    expect(loginSms(sent.devCode)).toContain("@www.msworkforce.au #" + sent.devCode)
    const logged = await verifyOtp(ctx, { mobile: "0400 111 222", code: sent.devCode })
    expect(logged.ok).toBe(true)
    if (!logged.ok || !("session" in logged) || !logged.session) throw new Error("no session")
    const oldExpiry = logged.session.expiresAt
    const later = { ...ctx, now: new Date(ctx.now.getTime() + 60 * 60 * 1000) }
    const renewed = await renewWorkerSession(later, logged.session.id)
    expect(renewed.renewed).toBe(true)
    if (!renewed.renewed) return
    expect(Date.parse(renewed.session.expiresAt) - later.now.getTime()).toBe(WORKER_SESSION_MS)
    expect(renewed.session.expiresAt).not.toBe(oldExpiry)
    expect(portalHome("worker")).toBe("/portal")
    expect(portalHome(null)).toBe("/portal/login")
  })

  it("keeps the admin session at 12 hours", async () => {
    const { ctx } = harness()
    const sent = await requestOtp(ctx, { mobile: "0400 000 001", ip: "local" })
    expect(sent.ok).toBe(true)
    if (!sent.ok || !sent.devCode) throw new Error("missing code")
    const step = await verifyOtp(ctx, { mobile: "0400 000 001", code: sent.devCode })
    expect(step.ok && "needsTotp" in step && step.needsTotp).toBe(true)
    if (!step.ok || !("workerId" in step) || !step.workerId) throw new Error("no admin")
    const code = totpCode(adminTotpSecret(), ctx.now.getTime())
    const confirmed = await confirmAdminTotp(ctx, step.workerId, code)
    expect(confirmed.ok).toBe(true)
    if (!confirmed.ok) return
    expect(Date.parse(confirmed.session.expiresAt) - ctx.now.getTime()).toBe(ADMIN_SESSION_MS)
    const renewed = await renewWorkerSession(ctx, confirmed.session.id)
    expect(renewed.renewed).toBe(false)
    expect(portalHome("admin")).toBe("/portal/admin")
  })
})
