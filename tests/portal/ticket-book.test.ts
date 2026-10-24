import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { AddPicker } from "@/components/portal/AddPicker"
import {
  customTicketNameProblem,
  matchesSearch,
  notionOtherTickets,
  ticketCatalogue,
  ticketRows,
} from "@/lib/portal/ticket-catalogue"
import { saveOtherLicences, saveTicketPhoto, type Ctx } from "@/lib/portal/services"
import { workerNotionProperties } from "@/lib/portal/notion/map"
import { createNotify } from "@/lib/portal/notify"
import { createMemoryStore } from "@/lib/portal/store"
import { SENSITIVE_MESSAGE } from "@/lib/portal/privacy"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined, refresh: () => undefined }),
}))

vi.mock("@/app/portal/actions", () => ({
  updateTicket: async () => ({ ok: true as const }),
  saveHeldLicences: async () => ({ ok: true as const }),
  uploadTicketPhoto: async () => ({ ok: true as const }),
}))

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xd9])
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64")

function harness(now = new Date("2026-10-17T01:00:00.000Z")) {
  const store = createMemoryStore({ seed: true, now })
  const notify = createNotify(store, "mock", async () => {
    throw new Error("network")
  })
  const ctx: Ctx = { store, now, mode: "mock", notify }
  return ctx
}

describe("tickets and training picker", () => {
  it("shows only added rows, and always includes the White card", async () => {
    const rows = ticketRows({
      today: "2026-10-17",
      tickets: {
        whiteCard: { status: "No" },
        heights: { status: "No" },
        driverLicence: { status: "Yes, I have it", expiry: "2027-10-17" },
        firstAid: { status: "Booked in for the course" },
      },
      otherHeld: ["Forklift (LF)", "None of these", "Silica awareness", "Boom lift ticket"],
      otherDetails: {
        "Forklift (LF)": { expiry: "2026-10-01" },
        "Silica awareness": { expiry: null },
        "Boom lift ticket": { expiry: "2026-11-01" },
      },
    })
    const labels = rows.map((row) => row.label + ":" + row.status)
    expect(labels).toContain("White card:Not added yet")
    expect(labels).toContain("Driver licence:Valid")
    expect(labels).toContain("First aid:Booked")
    expect(labels).toContain("Forklift (LF):Expired")
    expect(labels).toContain("Silica awareness:Valid")
    expect(labels).toContain("Boom lift ticket:Expires soon")
    expect(labels.join(" ")).not.toContain("Work at heights")
    expect(labels.join(" ")).not.toContain("None of these")
    expect(labels.join(" ")).not.toContain("Manual handling")
    const handling = ticketRows({
      today: "2026-10-17",
      tickets: { whiteCard: { status: "No" } },
      otherHeld: ["Manual handling"],
      otherDetails: { "Manual handling": { expiry: "2020-01-01" } },
    })
    expect(handling.find((row) => row.label === "Manual handling")?.status).toBe("Valid")

    const soon = ticketRows({
      today: "2026-10-17",
      tickets: { whiteCard: { status: "Yes, I have it", expiry: "2026-11-01" }, firstAid: { status: "Yes, I have it", expiry: "2026-12-01" }, heights: { status: "Yes, I have it", expiry: "2026-12-01" } },
    })
    expect(soon.find((row) => row.key === "whiteCard")?.status).toBe("Expires soon")
    expect(soon.find((row) => row.key === "firstAid")?.status).toBe("Expires soon")
    expect(soon.find((row) => row.key === "heights")?.status).toBe("Valid")

    const { TicketBook } = await import("@/components/portal/TicketBook")
    const html = renderToStaticMarkup(
      createElement(TicketBook, {
        today: "2026-10-17",
        tickets: { whiteCard: { status: "Yes, I have it", expiry: "2027-10-17" }, heights: { status: "No" } },
        otherHeld: ["Forklift (LF)"],
        otherDetails: { "Forklift (LF)": { expiry: "2027-06-01" } },
        photos: [],
      }),
    )
    expect(html).toContain("White card")
    expect(html).toContain("Forklift (LF)")
    expect(html).toContain("Valid")
    expect(html).toContain("+ Add ticket or training")
    expect(html).not.toContain("Work at heights")
    expect(html).not.toContain("Silica awareness")
    expect(html).not.toContain("Asbestos Class A")

    const driver = renderToStaticMarkup(
      createElement(TicketBook, {
        today: "2026-10-17",
        tickets: { whiteCard: { status: "No" }, driverLicence: { status: "Yes, I have it", expiry: "2028-01-01" } },
        otherHeld: [],
        otherDetails: {},
        photos: [],
        initialEditing: { kind: "ticket", key: "driverLicence" },
      }),
    )
    expect(driver).toContain("Licence number")
    expect(driver).toContain("Card number")
    expect(driver).toContain("Issue date")
  })

  it("groups the picker and greys out anything already added", () => {
    const groups = ticketCatalogue()
    expect(groups.map((group) => group.name)).toEqual(["Licences", "Training"])
    const training = groups[1].items.map((item) => item.label)
    expect(training).toEqual(["Asbestos awareness", "Silica awareness", "Manual handling"])
    expect(groups[0].items.some((item) => item.label === "White card")).toBe(true)
    expect(groups[0].items.some((item) => item.label === "Forklift (LF)")).toBe(true)
    expect(groups[0].items.some((item) => item.label === "Asbestos awareness")).toBe(false)
    expect(groups[0].items.some((item) => item.label === "Manual handling")).toBe(false)
    expect(groups[0].items.some((item) => item.label === "None of these")).toBe(false)
    expect(matchesSearch("Forklift (LF)", "fork")).toBe(true)
    expect(matchesSearch("White card", "silica")).toBe(false)

    const html = renderToStaticMarkup(
      createElement(AddPicker, {
        title: "Add ticket or training",
        groups,
        addedIds: ["ticket:whiteCard"],
        onChoose: () => undefined,
        onClose: () => undefined,
        other: { onAdd: () => "Type the name of the ticket or training." },
      }),
    )
    expect(html).toContain("Licences")
    expect(html).toContain("Training")
    expect(html).toContain("Already added")
    expect(html).toContain("disabled")
    expect(html).toContain("Type the name")
    expect(html).toContain('id="add-picker-search"')
    expect(customTicketNameProblem("")).toMatch(/type the name/i)
    expect(customTicketNameProblem("Forklift (LF)")).toMatch(/already in the list/i)
    expect(customTicketNameProblem("bank account 123")).toBe(SENSITIVE_MESSAGE)
    expect(customTicketNameProblem("Boom lift ticket")).toBeNull()
  })

  it("stores a typed name in the portal and keeps it out of the Notion multi-select", async () => {
    const ctx = harness()
    expect((await saveTicketPhoto(ctx, "w-sam", { bytes: JPEG, licenceKey: "Boom lift ticket", side: "front" })).ok).toBe(true)
    expect((await saveTicketPhoto(ctx, "w-sam", { bytes: PNG, licenceKey: "Boom lift ticket", side: "back" })).ok).toBe(true)
    const blocked = await saveOtherLicences(ctx, "w-sam", ["bank account"], {})
    expect(blocked.ok).toBe(false)
    const sam = await ctx.store.workers.get("w-sam")
    if (!sam) throw new Error("missing worker")
    sam.licenceChecks = { "Forklift (LF)": { number: "LF-1", expiry: "2027-01-01", checkedBy: "Mav", checkedAt: "2026-10-01T00:00:00.000Z" } }
    await ctx.store.workers.save(sam)
    const saved = await saveOtherLicences(ctx, "w-sam", ["Forklift (LF)", "Boom lift ticket"], {
      "Boom lift ticket": { number: "BL-9", expiry: "2027-05-01" },
    })
    expect(saved.ok).toBe(true)
    const after = await ctx.store.workers.get("w-sam")
    expect(after?.otherTicketsHeld).toEqual(["Forklift (LF)", "Boom lift ticket"])
    expect(after?.licenceChecks?.["Forklift (LF)"]?.checkedBy).toBe("Mav")
    expect(after?.licenceChecks?.["Boom lift ticket"]?.number).toBe("BL-9")
    const split = notionOtherTickets(after?.otherTicketsHeld)
    expect(split.known).toEqual(["Forklift (LF)"])
    expect(split.custom).toEqual(["Boom lift ticket"])
    const props = workerNotionProperties(after!)
    expect(props["Other tickets held"]).toEqual(["Forklift (LF)"])
    expect(props["Other tickets"]).toBe("Boom lift ticket")
    expect(JSON.stringify(props["Other tickets held"])).not.toContain("Boom lift")
  })
})
