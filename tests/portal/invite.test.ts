import { describe, expect, it } from "vitest"
import { createInviteToken, readInviteToken } from "@/lib/portal/invite"
import { formatAuMobile } from "@/lib/portal/phone"
import { finishJoin, makeWorkerInvite, prepareJoin, type Ctx } from "@/lib/portal/services"
import { createNotify } from "@/lib/portal/notify"
import { createMemoryStore } from "@/lib/portal/store"

const NOW = new Date("2026-10-17T01:00:00.000Z")

function harness(now = NOW) {
  const store = createMemoryStore({ seed: true, now })
  const notify = createNotify(store, "mock", async () => {
    throw new Error("network")
  })
  const ctx: Ctx = { store, now, mode: "mock", notify }
  return { ctx }
}

function details(mobile: string, inviteToken?: string) {
  return {
    name: "New Person",
    mobile,
    email: "new.person@example.com",
    confirmEmail: "new.person@example.com",
    suburb: "Manly",
    postcode: "2095",
    roles: ["General labourer"],
    experience: "Keen to start.",
    privacyConsent: true as const,
    inviteToken,
  }
}

describe("worker invites", () => {
  it("round-trips a signed invite and rejects a tampered or expired one", () => {
    const now = NOW.getTime()
    const token = createInviteToken("Dave K", "+61400111222", now)
    const read = readInviteToken(token, now)
    expect(read.ok).toBe(true)
    if (!read.ok) return
    expect(read.name).toBe("Dave K")
    expect(read.mobile).toBe("+61400111222")
    expect(read.invitedAs).toBe("Invited as Dave K, 17 Oct")
    expect(formatAuMobile(read.mobile)).toBe("0400 111 222")

    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a")
    expect(readInviteToken(tampered, now)).toEqual({ ok: false, reason: "invalid" })

    const stale = createInviteToken("Dave K", "+61400111222", now - 15 * 24 * 60 * 60 * 1000)
    expect(readInviteToken(stale, now)).toEqual({ ok: false, reason: "expired" })
  })

  it("pre-fills from a valid invite and saves invitedAs only after the code is verified", async () => {
    const { ctx } = harness()
    const made = await makeWorkerInvite(ctx, { name: "Dave K", mobile: "0499 333 444" })
    expect(made.ok).toBe(true)
    if (!made.ok) return
    const token = new URL("http://localhost:3000" + made.path).searchParams.get("invite") || ""
    const prefill = readInviteToken(token, ctx.now.getTime())
    expect(prefill.ok).toBe(true)
    if (!prefill.ok) return
    expect(prefill.name).toBe("Dave K")
    expect(formatAuMobile(prefill.mobile)).toBe("0499 333 444")

    const before = (await ctx.store.workers.all()).map((worker) => worker.id)
    const sent = await prepareJoin(ctx, details("0499 333 444", token), "203.0.113.20")
    expect(sent.ok).toBe(true)
    if (!sent.ok || !sent.devCode) throw new Error("missing code")
    expect(sent.draft.invitedAs).toBe("Invited as Dave K, 17 Oct")
    expect((await ctx.store.workers.all()).map((worker) => worker.id)).toEqual(before)

    const done = await finishJoin(ctx, sent.draft, sent.devCode)
    expect(done.ok).toBe(true)
    const created = (await ctx.store.workers.all()).find((worker) => worker.mobile === "+61499333444")
    expect(created?.invitedAs).toBe("Invited as Dave K, 17 Oct")
    expect(created?.notes).toBeUndefined()
    const queued = (await ctx.store.outbox.all()).filter((item) => item.kind === "workers").at(-1)
    const packed = JSON.stringify(queued?.payload)
    expect(packed).not.toContain("Invited as")
    expect(packed).not.toContain("invitedAs")
    const audits = await ctx.store.audits.all()
    expect(audits.some((row) => row.action === "invite" && row.detail === "Invited as Dave K, 17 Oct")).toBe(true)
  })

  it("sends no text when an invite is made", async () => {
    const { ctx } = harness()
    const notes = await ctx.store.notifications.all()
    const codes = await ctx.store.challenges.all()
    const made = await makeWorkerInvite(ctx, { name: "Dave K", mobile: "0499 333 444" })
    expect(made.ok).toBe(true)
    expect(await ctx.store.notifications.all()).toEqual(notes)
    expect(await ctx.store.challenges.all()).toEqual(codes)
  })
})
