import { describe, expect, it } from "vitest"
import { cardsAwaitingCheck, greetingFor, inductionTodoCount, nextBookedShift, offersWaiting, photosAwaitingApproval, shiftsMissingSupervisorSign, ticketActionCount, unsignedFortnightDays, workerHomeRows } from "@/lib/portal/home"

describe("home badges", () => {
  it("counts offers, unsigned days and induction to-dos", () => {
    const offers = [
      { workerId: "w-sam", status: "Offered", shiftDate: "2026-10-20", inductionLink: "" },
      { workerId: "w-sam", status: "Offered", shiftDate: "2026-10-21" },
      { workerId: "w-sam", status: "Accepted", shiftDate: "2026-10-16", inductionLink: "https://example.com/site" },
      { workerId: "w-sam", status: "Accepted", shiftDate: "2026-10-18" },
      { workerId: "w-alex", status: "Offered", shiftDate: "2026-10-20" },
    ]
    expect(offersWaiting(offers, "w-sam")).toBe(2)
    const sheets = [{ workerId: "w-sam", workDate: "2026-10-15", status: "Approved" }]
    expect(unsignedFortnightDays([{ ...offers[2], shiftDate: "2026-10-15" }, offers[2]], sheets, "w-sam", "2026-10-17")).toBe(1)
    expect(inductionTodoCount(false, offers, "w-sam", "2026-10-17")).toBe(1)
    expect(inductionTodoCount(true, offers, "w-sam", "2026-10-17")).toBe(0)
    expect(ticketActionCount(["White card", "White card", "Forklift (LF)"])).toBe(2)
    expect(cardsAwaitingCheck([{ tickets: { whiteCard: { status: "Yes, I have it" } }, otherTicketsHeld: ["Forklift (LF)"] }])).toBe(2)
    expect(photosAwaitingApproval([{ kind: "headshot", headshotStatus: "Pending" }, { kind: "ticket", headshotStatus: "Pending" }])).toBe(1)
    const past = [
      { id: "offer-old", workerId: "w-sam", status: "Accepted", shiftDate: "2026-10-16" },
      { id: "offer-today", workerId: "w-sam", status: "Accepted", shiftDate: "2026-10-17" },
      { id: "offer-signed", workerId: "w-sam", status: "Accepted", shiftDate: "2026-10-15" },
    ]
    const flagged = shiftsMissingSupervisorSign(
      past,
      [
        { workerId: "w-sam", offerId: "offer-signed", workDate: "2026-10-15", signaturePng: "data:image/png;base64,abc" },
        { workerId: "w-sam", offerId: "offer-old", workDate: "2026-10-16" },
      ],
      "w-sam",
      "2026-10-17",
    )
    expect(flagged.map((offer) => offer.id)).toEqual(["offer-old"])
    expect(greetingFor(8 * 60)).toBe("Good morning")
    expect(greetingFor(14 * 60)).toBe("Good afternoon")
    const booked = nextBookedShift(
      [
        { status: "Accepted", shiftDate: "2026-10-18", startTime: "07:00" },
        { status: "Accepted", shiftDate: "2026-10-17", startTime: "07:00" },
        { status: "Offered", shiftDate: "2026-10-17", startTime: "06:00" },
      ],
      "2026-10-17",
    )
    expect(booked?.when).toBe("today")
    expect(nextBookedShift([], "2026-10-17")).toBeNull()
    const rows = workerHomeRows({
      offerCount: 1,
      hasShift: false,
      timesheetUnsigned: true,
      ticketState: "expiring",
      inductionTodos: 1,
      safetySaved: false,
    })
    expect(rows.map((row) => row.status)).toEqual([
      "Timesheet not signed",
      "Offer waiting",
      "Ticket expiring",
      "Induction to do",
      "Not added yet",
    ])
    expect(rows.every((row) => row.attention)).toBe(true)
    expect(
      unsignedFortnightDays(
        [{ workerId: "w-sam", status: "Accepted", shiftDate: "2026-10-16" }],
        [{ workerId: "w-sam", workDate: "2026-10-16", status: "Submitted", signaturePng: "data:image/png;base64,abc" }],
        "w-sam",
        "2026-10-17",
      ),
    ).toBe(0)
  })
})
