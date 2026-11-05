import { describe, expect, it } from "vitest"
import {
  cellMarks,
  dayAria,
  dayEntries,
  daysInMonth,
  monthCells,
  resolveView,
  sheetMark,
} from "@/lib/portal/calendar"
import { sydneyToday } from "@/lib/portal/dates"

const offer = (patch: Record<string, string>) => ({
  id: "o1",
  workerId: "w-sam",
  status: "Accepted",
  shiftDate: "2026-10-29",
  startTime: "07:00",
  roleName: "Labourer",
  suburb: "Dee Why",
  siteName: "Dee Why",
  ...patch,
})

describe("shift calendar", () => {
  it("builds months of 28, 30 and 31 days, Monday first", () => {
    expect(daysInMonth("2026-02")).toBe(28)
    expect(daysInMonth("2026-04")).toBe(30)
    expect(daysInMonth("2026-10")).toBe(31)
    expect(monthCells("2026-02").filter(Boolean)).toHaveLength(28)
    expect(monthCells("2026-04").filter(Boolean)).toHaveLength(30)
    expect(monthCells("2026-10").filter(Boolean)).toHaveLength(31)
    const sunday = monthCells("2026-11")
    expect(sunday.slice(0, 6).every((cell) => cell === null)).toBe(true)
    expect(sunday[6]).toBe("2026-11-01")
    const monday = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-08", "2026-09", "2026-12"].find(
      (month) => monthCells(month)[0]?.endsWith("-01"),
    )
    expect(monday).toBeTruthy()
    expect(monthCells(monday || "")[0]?.endsWith("-01")).toBe(true)
    for (const month of ["2026-02", "2026-04", "2026-10", "2026-11"]) {
      expect(monthCells(month).length % 7).toBe(0)
    }
  })

  it("uses the Sydney date around midnight and opens on today", () => {
    expect(sydneyToday(new Date("2026-10-30T12:00:00Z"))).toBe("2026-10-30")
    expect(sydneyToday(new Date("2026-10-30T14:00:00Z"))).toBe("2026-10-31")
    expect(resolveView(undefined, undefined, "2026-10-30")).toEqual({ month: "2026-10", day: "2026-10-30", today: "2026-10-30" })
    expect(resolveView("2026-09", "2026-10-30", "2026-10-30").day).toBeNull()
    expect(resolveView("2026-10", "2026-10-29", "2026-10-30").day).toBe("2026-10-29")
  })

  it("marks each timesheet status, an offer, two shifts, and an empty day", () => {
    const today = "2026-10-30"
    expect(sheetMark("2026-10-31", today, null)).toBe("future")
    expect(sheetMark("2026-10-29", today, null)).toBe("unsigned")
    expect(sheetMark("2026-10-29", today, { id: "t", workerId: "w-sam", workDate: "2026-10-29", status: "Approved", totalHours: 8 })).toBe("approved")
    expect(sheetMark("2026-10-29", today, { id: "t", workerId: "w-sam", workDate: "2026-10-29", status: "Submitted", totalHours: 8 })).toBe("submitted")
    expect(sheetMark("2026-10-29", today, { id: "t", workerId: "w-sam", workDate: "2026-10-29", status: "Queried", totalHours: 8 })).toBe("queried")
    expect(sheetMark("2026-10-29", today, { id: "t", workerId: "w-sam", workDate: "2026-10-29", status: "Draft", totalHours: 8 })).toBe("unsigned")

    const offered = dayEntries([offer({ id: "open", status: "Offered", shiftDate: "2026-10-31", siteName: "" })], [], "w-sam", "2026-10-31", today)
    expect(cellMarks(offered)).toMatchObject({ accepted: false, offered: true, mark: "none" })

    const two = dayEntries(
      [
        offer({ id: "a", shiftDate: "2026-10-29", siteName: "Dee Why" }),
        offer({ id: "b", shiftDate: "2026-10-29", siteName: "Brookvale", suburb: "Brookvale" }),
      ],
      [{ id: "ts", workerId: "w-sam", offerId: "a", workDate: "2026-10-29", status: "Approved", totalHours: 8 }],
      "w-sam",
      "2026-10-29",
      today,
    )
    expect(two).toHaveLength(2)
    expect(two.map((entry) => entry.mark).sort()).toEqual(["approved", "unsigned"])
    expect(cellMarks(two).accepted).toBe(true)

    expect(dayEntries([], [], "w-sam", "2026-10-30", today)).toEqual([])
    expect(dayAria("2026-10-29", two, today)).toContain("Shift at Dee Why")
    expect(dayAria("2026-10-29", two, today)).toContain("Timesheet approved")
    expect(dayAria("2026-10-30", [], today)).toBe("Friday 30 October. Today. Nothing on this day.")
    const hidden = dayEntries(
      [offer({ status: "Declined" }), offer({ id: "gone", status: "Cancelled" }), offer({ id: "old", status: "Expired" })],
      [],
      "w-sam",
      "2026-10-29",
      today,
    )
    expect(hidden).toEqual([])
  })
})
