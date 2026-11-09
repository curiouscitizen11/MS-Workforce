import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { DetailsForm } from "@/components/portal/MeForms"
import { createNotify } from "@/lib/portal/notify"
import { saveMyDetails, type Ctx } from "@/lib/portal/services"
import { createMemoryStore } from "@/lib/portal/store"

function harness() {
  const now = new Date("2026-10-17T01:00:00.000Z")
  const store = createMemoryStore({ seed: true, now })
  const ctx: Ctx = { store, now, mode: "mock", notify: createNotify(store, "mock", async () => { throw new Error("network") }) }
  return ctx
}

describe("my details", () => {
  it("does not ask for a preferred name and leaves a stored one alone", async () => {
    const ctx = harness()
    const sam = await ctx.store.workers.get("w-sam")
    if (!sam) throw new Error("missing sam")
    sam.preferredName = "Sammy"
    await ctx.store.workers.save(sam)
    const page = renderToStaticMarkup(createElement(DetailsForm, { worker: sam }))
    expect(page).not.toContain("Preferred name")
    expect(page).toContain("Suburb")
    const saved = await saveMyDetails(ctx, "w-sam", { suburb: "Parramatta", postcode: "2150" })
    expect(saved.ok).toBe(true)
    const after = await ctx.store.workers.get("w-sam")
    expect(after?.preferredName).toBe("Sammy")
    expect(after?.suburb).toBe("Parramatta")
    expect(after?.postcode).toBe("2150")
  })
})
