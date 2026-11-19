import { describe, expect, it } from "vitest"
import { createNotify } from "@/lib/portal/notify"
import { finishJoin, prepareJoin, type Ctx } from "@/lib/portal/services"
import { createMemoryStore } from "@/lib/portal/store"

function harness(now = new Date("2026-10-17T01:00:00.000Z")) {
  const store = createMemoryStore({ seed: true, now })
  const notify = createNotify(store, "mock", async () => {
    throw new Error("network")
  })
  const ctx: Ctx = { store, now, mode: "mock", notify }
  return { ctx }
}

function details(mobile: string) {
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
  }
}

describe("join codes", () => {
  it("creates no worker until the code is verified", async () => {
    const { ctx } = harness()
    const before = (await ctx.store.workers.all()).map((worker) => worker.id)
    const sent = await prepareJoin(ctx, details("0499 111 222"), "203.0.113.8")
    expect(sent.ok).toBe(true)
    if (!sent.ok || !sent.devCode) throw new Error("missing code")
    expect((await ctx.store.workers.all()).map((worker) => worker.id)).toEqual(before)
    const wrong = await finishJoin(ctx, sent.draft, "000000")
    expect(wrong.ok).toBe(false)
    expect((await ctx.store.workers.all()).map((worker) => worker.id)).toEqual(before)
    const done = await finishJoin(ctx, sent.draft, sent.devCode)
    expect(done.ok).toBe(true)
    const created = (await ctx.store.workers.all()).find((worker) => worker.mobile === "+61499111222")
    expect(created?.status).toBe("Applicant")
    expect(created?.name).toBe("New Person")
    expect(created?.postcode).toBe("2095")
  })

  it("keeps a plant licence and refuses a role that is no longer offered", async () => {
    const { ctx } = harness()
    const retired = await prepareJoin(
      ctx,
      { ...details("0499 333 444"), email: "retired.role@example.com", confirmEmail: "retired.role@example.com", roles: ["Site clean"] },
      "203.0.113.20",
    )
    expect(retired.ok).toBe(false)
    const sent = await prepareJoin(
      ctx,
      {
        ...details("0499 333 444"),
        email: "plant.person@example.com",
        confirmEmail: "plant.person@example.com",
        roles: ["Excavator"],
        roleLicence: "VOC",
      },
      "203.0.113.21",
    )
    expect(sent.ok).toBe(true)
    if (!sent.ok || !sent.devCode) throw new Error("missing code")
    expect(sent.draft.roleLicence).toBe("VOC")
    const done = await finishJoin(ctx, sent.draft, sent.devCode)
    expect(done.ok).toBe(true)
    const created = (await ctx.store.workers.all()).find((worker) => worker.email === "plant.person@example.com")
    expect(created?.roles).toEqual(["Excavator"])
    expect(created?.roleLicence).toBe("VOC")
    const labour = await prepareJoin(
      ctx,
      {
        ...details("0499 444 555"),
        email: "labour.only@example.com",
        confirmEmail: "labour.only@example.com",
        roles: ["General labourer"],
        roleLicence: "VOC",
      },
      "203.0.113.22",
    )
    expect(labour.ok).toBe(true)
    if (!labour.ok) return
    expect(labour.draft.roleLicence).toBe("")
  })

  it("sends no code when the mobile is already on file", async () => {
    const { ctx } = harness()
    const before = await ctx.store.challenges.all()
    const sent = await prepareJoin(ctx, details("0400 111 222"), "203.0.113.9")
    expect(sent.ok).toBe(false)
    if (sent.ok) return
    expect(sent.error).toBe("Looks like you've already joined. Log in instead.")
    expect(await ctx.store.challenges.all()).toEqual(before)
    const notes = await ctx.store.notifications.all()
    expect(notes.map((item) => item.body).join("\n")).not.toContain("Login code sent")
  })

  it("keeps the send limit and locks after five wrong codes", async () => {
    const { ctx } = harness()
    const first = await prepareJoin(ctx, details("0499 222 333"), "203.0.113.10")
    expect(first.ok).toBe(true)
    if (!first.ok || !first.devCode) throw new Error("missing code")
    expect((await prepareJoin(ctx, details("0499 222 333"), "203.0.113.10")).ok).toBe(true)
    expect((await prepareJoin(ctx, details("0499 222 333"), "203.0.113.10")).ok).toBe(true)
    const limited = await prepareJoin(ctx, details("0499 222 333"), "203.0.113.10")
    expect(limited.ok).toBe(false)
    if (limited.ok) return
    expect(limited.error).toMatch(/Wait a few minutes/)
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const bad = await finishJoin(ctx, first.draft, "111111")
      expect(bad.ok).toBe(false)
    }
    const locked = await finishJoin(ctx, first.draft, "111111")
    expect(locked.ok).toBe(false)
    if (locked.ok) return
    expect(locked.error).toMatch(/15 minutes/)
    expect((await ctx.store.workers.all()).some((worker) => worker.mobile === "+61499222333")).toBe(false)
  })
})
