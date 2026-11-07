import { describe, expect, it } from "vitest"
import { inductionPickerSites, inductionRows } from "@/lib/portal/inductions"
import { createNotify } from "@/lib/portal/notify"
import { saveSiteInduction, type Ctx } from "@/lib/portal/services"
import { createMemoryStore } from "@/lib/portal/store"

describe("inductions", () => {
  it("lists the WHS induction and a site, and keeps a done date", async () => {
    const rows = inductionRows({
      inductionPassed: "2026-10-03",
      offers: [
        { status: "Accepted", siteName: "Brookvale frame stage", inductionLink: "https://example.com/site" },
        { status: "Accepted", siteName: "Brookvale frame stage" },
        { status: "Offered", suburb: "Dee Why" },
      ],
      siteInductions: [{ name: "Harbour bridge", doneOn: "2026-10-02" }],
    })
    expect(rows.map((row) => row.name)).toEqual(["MS Workforce WHS induction", "Brookvale frame stage", "Harbour bridge"])
    expect(rows[0].status.startsWith("Done ")).toBe(true)
    expect(rows[0].href).toBe("/portal/induction")
    expect(rows[1].status).toBe("To do")
    expect(rows[1].link).toBe("https://example.com/site")
    expect(rows[2].status.startsWith("Done ")).toBe(true)
    expect(inductionPickerSites([{ status: "Offered", suburb: "Dee Why" }], rows).map((item) => item.label)).toEqual(["Dee Why"])

    const now = new Date("2026-10-17T01:00:00.000Z")
    const store = createMemoryStore({ seed: true, now })
    const ctx: Ctx = { store, now, mode: "mock", notify: createNotify(store, "mock", async () => { throw new Error("network") }) }
    const saved = await saveSiteInduction(ctx, "w-sam", { name: "Brookvale frame stage", done: true })
    expect(saved.ok).toBe(true)
    const again = await saveSiteInduction(ctx, "w-sam", { name: "brookvale frame stage", done: true })
    expect(again.ok).toBe(true)
    const sam = await store.workers.get("w-sam")
    expect(sam?.siteInductions).toEqual([{ name: "Brookvale frame stage", doneOn: "2026-10-17" }])
    const blocked = await saveSiteInduction(ctx, "w-sam", { name: "123456789" })
    expect(blocked.ok).toBe(false)
  })
})