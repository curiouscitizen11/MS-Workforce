import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { ChosenList } from "@/components/portal/AddPicker"
import { OfferComposer } from "@/components/portal/AdminForms"
import { saveOnboarding, type Ctx } from "@/lib/portal/services"
import { createNotify } from "@/lib/portal/notify"
import { createMemoryStore } from "@/lib/portal/store"
import { WORK_AREAS } from "@/lib/portal/types"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined, refresh: () => undefined }),
}))

vi.mock("@/app/portal/actions", () => ({
  sendShiftOffers: async () => ({ ok: true as const, created: [], skipped: [] }),
  saveVerification: async () => ({ ok: true as const }),
  showPassport: async () => ({ ok: true as const, country: "", number: "" }),
  removeImages: async () => ({ ok: true as const }),
  signOutWorker: async () => ({ ok: true as const }),
}))

describe("chosen rows for long lists", () => {
  it("shows only the areas that were added", () => {
    const html = renderToStaticMarkup(
      createElement(ChosenList, {
        legend: "Work areas",
        addLabel: "+ Add area",
        groups: [{ name: "Areas", items: WORK_AREAS.map((area) => ({ id: area, label: area })) }],
        selected: ["Northern Beaches"],
        onChange: () => undefined,
      }),
    )
    expect(html).toContain("Northern Beaches")
    expect(html).toContain("+ Add area")
    expect(html).not.toContain("Central Coast")
    expect(html).not.toContain("Sutherland Shire")
  })

  it("keeps the worker list hidden until the offer is not for everyone", () => {
    const html = renderToStaticMarkup(
      createElement(OfferComposer, {
        workers: [
          { id: "w-sam", name: "Sam Lee", label: "OK" },
          { id: "w-alex", name: "Alex Nguyen", label: "DO NOT BOOK" },
        ],
      }),
    )
    expect(html).toContain("Offer to every ready worker")
    expect(html).toContain("White card")
    expect(html).not.toContain("Sam Lee")
    expect(html).not.toContain("Alex Nguyen")
    expect(html).not.toContain("+ Add worker")
  })

  it("drops a work area that is not an existing option", async () => {
    const store = createMemoryStore({ seed: true, now: new Date("2026-10-17T01:00:00.000Z") })
    const notify = createNotify(store, "mock", async () => {
      throw new Error("network")
    })
    const ctx: Ctx = { store, now: new Date("2026-10-17T01:00:00.000Z"), mode: "mock", notify }
    const saved = await saveOnboarding(ctx, "w-casey", { workAreas: ["Northern Beaches", "Not a real area"] })
    expect(saved.ok).toBe(true)
    expect((await ctx.store.workers.get("w-casey"))?.workAreas).toEqual(["Northern Beaches"])
  })
})