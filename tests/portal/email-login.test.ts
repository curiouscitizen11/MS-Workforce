import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined, refresh: () => undefined }),
}))

import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { LoginForm } from "@/components/portal/LoginForm"
import { ensureAdminAccount } from "@/lib/portal/bootstrap"
import { createNotify } from "@/lib/portal/notify"
import { finishJoin, prepareJoin, requestEmailOtp, requestJoinCode, requestOtp, verifyEmailOtp, type Ctx } from "@/lib/portal/services"
import { createMemoryStore } from "@/lib/portal/store"

afterEach(() => {
  vi.unstubAllEnvs()
})

function harness(mode: "mock" | "live" = "mock", now = new Date("2026-10-17T01:00:00.000Z")) {
  const store = createMemoryStore({ seed: true, now })
  const calls: string[] = []
  const notify = createNotify(store, mode, async (url) => {
    calls.push(String(url))
    return new Response("no", { status: 500 })
  })
  const ctx: Ctx = { store, now, mode, notify }
  return { ctx, calls }
}

describe("email sign-in", () => {
  it("emails a code and does not store the code in the log", async () => {
    const { ctx, calls } = harness()
    const sent = await requestEmailOtp(ctx, { email: "Sam.Lee@example.com", ip: "203.0.113.4" })
    expect(sent.ok).toBe(true)
    if (!sent.ok || !sent.devCode) throw new Error("missing code")
    const notes = await ctx.store.notifications.all()
    expect(notes).toHaveLength(1)
    expect(notes[0].channel).toBe("email")
    expect(notes[0].to).toBe("sam.lee@example.com")
    expect(notes[0].body).toBe("Login code sent")
    expect(notes[0].body).not.toContain(sent.devCode)
    expect(calls).toEqual([])
    const logged = await verifyEmailOtp(ctx, { email: "sam.lee@example.com", code: sent.devCode })
    expect(logged.ok).toBe(true)
    if (!logged.ok || !("session" in logged)) throw new Error("no session")
    expect(logged.session?.role).toBe("worker")
  })

  it("keeps the admin authenticator step after the email code", async () => {
    const { ctx } = harness()
    const sent = await requestEmailOtp(ctx, { email: "hello@msworkforce.au", ip: "203.0.113.5" })
    expect(sent.ok).toBe(true)
    if (!sent.ok || !sent.devCode) throw new Error("missing code")
    const step = await verifyEmailOtp(ctx, { email: "hello@msworkforce.au", code: sent.devCode })
    expect(step.ok && "needsTotp" in step && step.needsTotp).toBe(true)
  })

  it("locks the email after five wrong codes", async () => {
    const { ctx } = harness()
    const sent = await requestEmailOtp(ctx, { email: "sam.lee@example.com", ip: "203.0.113.6" })
    expect(sent.ok).toBe(true)
    if (!sent.ok || !sent.devCode) throw new Error("missing code")
    for (let attempt = 0; attempt < 4; attempt += 1) {
      expect((await verifyEmailOtp(ctx, { email: "sam.lee@example.com", code: "000000" })).ok).toBe(false)
    }
    const locked = await verifyEmailOtp(ctx, { email: "sam.lee@example.com", code: "000000" })
    expect(locked.ok).toBe(false)
    if (locked.ok) return
    expect(locked.error).toMatch(/15 minutes/)
    const after = await verifyEmailOtp(ctx, { email: "sam.lee@example.com", code: sent.devCode })
    expect(after.ok).toBe(false)
  })

  it("does not call Twilio when those settings are absent", async () => {
    vi.stubEnv("TWILIO_ACCOUNT_SID", "")
    vi.stubEnv("TWILIO_AUTH_TOKEN", "")
    vi.stubEnv("TWILIO_FROM", "")
    vi.stubEnv("PORTAL_MODE", "live")
    vi.stubEnv("PORTAL_SESSION_SECRET", "a".repeat(40))
    const { ctx, calls } = harness("live")
    const sms = await requestOtp(ctx, { mobile: "0400 111 222", ip: "203.0.113.7" })
    expect(sms.ok).toBe(false)
    if (sms.ok) return
    expect(sms.error).toBe("Log in with the code we email you.")
    expect(sms.error.toLowerCase()).not.toContain("sms")
    expect(sms.error.toLowerCase()).not.toContain("twilio")
    const emailed = await requestEmailOtp(ctx, { email: "sam.lee@example.com", ip: "203.0.113.7" })
    expect(emailed.ok).toBe(false)
    if (emailed.ok) return
    expect(emailed.error).toBe("We could not send the code. Try again in a minute.")
    expect(emailed.error).not.toMatch(/Resend|Twilio|SMS|text message/i)
    expect(calls).toEqual([])
    await expect(ctx.notify.sms("+61400111222", "hello", "Login code sent")).resolves.toBeUndefined()
    expect(calls).toEqual([])
  })

  it("still sends a text code in demo mode, and when Twilio is configured", async () => {
    const demo = harness()
    const sent = await requestOtp(demo.ctx, { mobile: "0400 111 222", ip: "local" })
    expect(sent.ok).toBe(true)
    expect(demo.calls).toEqual([])
    const joinSms = await requestJoinCode(demo.ctx, { mobile: "0499 888 777", ip: "local" })
    expect(joinSms.ok).toBe(true)
  })

  it("requires an email before someone can join", async () => {
    const { ctx } = harness()
    const missing = await prepareJoin(
      ctx,
      {
        name: "New Person",
        mobile: "0499 111 222",
        email: "",
        confirmEmail: "",
        suburb: "Manly",
        postcode: "2095",
        roles: ["General labourer"],
        experience: "Keen to start.",
        privacyConsent: true,
      },
      "203.0.113.8",
    )
    expect(missing.ok).toBe(false)
    const taken = await prepareJoin(
      ctx,
      {
        name: "New Person",
        mobile: "0499 111 222",
        email: "sam.lee@example.com",
        confirmEmail: "sam.lee@example.com",
        suburb: "Manly",
        postcode: "2095",
        roles: ["General labourer"],
        privacyConsent: true,
      },
      "203.0.113.9",
    )
    expect(taken.ok).toBe(false)
    if (taken.ok) return
    expect(taken.error).toMatch(/already joined/)
    const sent = await prepareJoin(
      ctx,
      {
        name: "New Person",
        mobile: "0499 111 222",
        email: "New.Person@example.com",
        confirmEmail: "new.person@example.com",
        suburb: "Manly",
        postcode: "2095",
        roles: ["General labourer"],
        privacyConsent: true,
      },
      "203.0.113.10",
    )
    expect(sent.ok).toBe(true)
    if (!sent.ok || !sent.devCode) throw new Error("missing code")
    expect(sent.draft.email).toBe("new.person@example.com")
    const done = await finishJoin(ctx, sent.draft, sent.devCode)
    expect(done.ok).toBe(true)
    const created = (await ctx.store.workers.all()).find((worker) => worker.mobile === "+61499111222")
    expect(created?.email).toBe("new.person@example.com")
    const notes = await ctx.store.notifications.all()
    expect(notes.some((note) => note.channel === "sms")).toBe(false)
    expect(notes.some((note) => note.channel === "email" && note.body === "Login code sent")).toBe(true)
  })

  it("creates one admin login when the live database has none", async () => {
    vi.stubEnv("ADMIN_EMAIL", "hello@msworkforce.au")
    const store = createMemoryStore({ seed: false })
    const first = await ensureAdminAccount(store)
    const second = await ensureAdminAccount(store)
    expect(first?.email).toBe("hello@msworkforce.au")
    expect(first?.role).toBe("admin")
    expect(second?.id).toBe(first?.id)
    expect((await store.workers.all()).filter((worker) => worker.role === "admin")).toHaveLength(1)
  })

  it("does not mention a text message on the email login screen", () => {
    const html = renderToStaticMarkup(
      createElement(LoginForm, {
        mock: true,
        sms: false,
        demos: [{ name: "Sam Lee", email: "sam.lee@example.com", mobile: "0400 111 222", hint: "Worker" }],
      }),
    )
    expect(html).toContain("sam.lee@example.com")
    expect(html).toContain("Email me a link instead")
    expect(html).not.toContain("Text me")
    expect(html).not.toContain("by text")
    expect(html.toLowerCase()).not.toContain("sms")
    const withSms = renderToStaticMarkup(
      createElement(LoginForm, { mock: false, sms: true, demos: [] }),
    )
    expect(withSms).toContain("Text me a code instead")
  })
})
