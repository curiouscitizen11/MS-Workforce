import { describe, expect, it } from "vitest"
import { offersWaiting, weekSummary } from "@/lib/portal/home"
import { createMemoryStore } from "@/lib/portal/store"
import { loadWorkerHome } from "@/lib/portal/worker-home"

describe("worker home only loads that worker", () => {
  it("does not return another worker's offers, timesheets or documents", async () => {
    const store = createMemoryStore({ seed: true, now: new Date("2026-11-15T01:00:00.000Z") })
    const sam = await loadWorkerHome(store, "w-sam")
    const alex = await loadWorkerHome(store, "w-alex")

    expect(sam.offers.every((offer) => offer.workerId === "w-sam")).toBe(true)
    expect(sam.sheets.every((sheet) => sheet.workerId === "w-sam")).toBe(true)
    expect(sam.documents.every((doc) => doc.workerId === "w-sam")).toBe(true)
    expect(alex.offers.every((offer) => offer.workerId === "w-alex")).toBe(true)
    expect(alex.sheets).toEqual([])
    expect(alex.documents).toEqual([])
    expect(sam.offers.some((offer) => offer.id === "offer-alex-open")).toBe(false)
    expect(alex.offers.some((offer) => offer.workerId === "w-sam")).toBe(false)
    expect((await store.offers.all()).length).toBeGreaterThan(sam.offers.length)
  })

  it("still shows Sam's offer, today's shift and signed hours", async () => {
    const now = new Date("2026-11-15T01:00:00.000Z")
    const store = createMemoryStore({ seed: true, now })
    let fullReads = 0
    const counting = {
      ...store,
      offers: {
        ...store.offers,
        all: async () => {
          fullReads += 1
          return store.offers.all()
        },
      },
      timesheets: {
        ...store.timesheets,
        all: async () => {
          fullReads += 1
          return store.timesheets.all()
        },
      },
      documents: {
        ...store.documents,
        all: async () => {
          fullReads += 1
          return store.documents.all()
        },
      },
    }
    const home = await loadWorkerHome(counting, "w-sam")
    expect(fullReads).toBe(0)
    expect(home.offers.find((offer) => offer.status === "Offered")?.suburb).toBe("Dee Why")
    expect(home.offers.find((offer) => offer.status === "Accepted" && offer.shiftDate === "2026-11-15")?.siteName).toBe("Brookvale frame stage")
    expect(home.sheets[0]?.status).toBe("Approved")
    expect(home.sheets[0]?.totalHours).toBe(8)
    expect(offersWaiting(home.offers, "w-sam")).toBe(1)
    expect(weekSummary(home.offers, home.sheets, "w-sam", "2026-11-15").text).toContain("approved")
    expect(home.documents.map((doc) => doc.id).sort()).toEqual([
      "doc-sam-lf-back",
      "doc-sam-lf-front",
      "doc-sam-wc-back",
      "doc-sam-wc-front",
    ])
  })
})
