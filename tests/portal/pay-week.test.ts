import { afterEach, describe, expect, it, vi } from "vitest"
import { formatLongDate, isThursday, parseCalendarDate, sydneyParts, sydneyToday } from "@/lib/portal/dates"
import { createNotify } from "@/lib/portal/notify"
import {
  DEFAULT_PAY_ANCHOR,
  datesInWeek,
  payAnchor,
  payRunWeek,
  payWeek,
  timesheetIsSigned,
  timesheetReminder,
  weekContaining,
} from "@/lib/portal/pay"
import { runReminders, saveOnboarding, type Ctx } from "@/lib/portal/services"
import { createMemoryStore } from "@/lib/portal/store"
import { toNotionProperties } from "@/lib/portal/notion/map"

afterEach(() => {
  vi.unstubAllEnvs()
})

const ANCHOR = DEFAULT_PAY_ANCHOR

function weekOf(iso: string) {
  return weekContaining(iso, ANCHOR)
}

describe("weekly pay", () => {
  it("keeps every day from Thursday to the next Wednesday in one week", () => {
    const days = ["2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08", "2026-11-09", "2026-11-10", "2026-11-11"]
    for (const day of days) {
      expect(weekOf(day)).toMatchObject({
        start: "2026-11-05",
        end: "2026-11-11",
        payDay: "2026-11-12",
        label: "2026-11-05 to 2026-11-11",
        afterCutoff: false,
      })
    }
    expect(datesInWeek(weekOf("2026-11-08"))).toEqual(days)
    expect(isThursday(weekOf("2026-11-08").start)).toBe(true)
    expect(isThursday(weekOf("2026-11-08").payDay)).toBe(true)
    expect(weekOf("2026-11-04")).toMatchObject({ start: "2026-10-29", end: "2026-11-04", payDay: "2026-11-05" })
    expect(weekOf("2026-11-12")).toMatchObject({ start: "2026-11-12", end: "2026-11-18", payDay: "2026-11-19" })
  })

  it("uses Sydney time across daylight saving, not the UTC date", () => {
    const stillWednesday = new Date("2026-11-11T12:00:00.000Z")
    expect(sydneyParts(stillWednesday)).toMatchObject({ iso: "2026-11-11", weekday: expect.stringMatching(/^Wed/) })
    expect(payWeek(stillWednesday, ANCHOR)).toMatchObject({
      start: "2026-11-12",
      end: "2026-11-18",
      payDay: "2026-11-19",
      afterCutoff: true,
    })

    const thursdayMorning = new Date("2026-11-11T14:00:00.000Z")
    expect(sydneyToday(thursdayMorning)).toBe("2026-11-12")
    expect(sydneyParts(thursdayMorning).weekday.startsWith("Thu")).toBe(true)
    expect(payWeek(thursdayMorning, ANCHOR)).toMatchObject({
      start: "2026-11-12",
      end: "2026-11-18",
      payDay: "2026-11-19",
      afterCutoff: false,
    })
    expect(payRunWeek(thursdayMorning, ANCHOR)).toMatchObject({
      start: "2026-11-05",
      end: "2026-11-11",
      payDay: "2026-11-12",
    })

    const sixPmAedt = new Date("2026-11-11T07:00:00.000Z")
    expect(sydneyParts(sixPmAedt)).toMatchObject({ iso: "2026-11-11", minutes: 18 * 60 })
    expect(payWeek(sixPmAedt, ANCHOR).afterCutoff).toBe(false)
    expect(payWeek(new Date(sixPmAedt.getTime() + 60 * 1000), ANCHOR).afterCutoff).toBe(true)

    const sixPmAest = new Date("2026-04-15T08:00:00.000Z")
    expect(sydneyParts(sixPmAest)).toMatchObject({ iso: "2026-04-15", minutes: 18 * 60 })
    expect(weekOf("2026-04-15")).toMatchObject({ start: "2026-04-09", end: "2026-04-15", payDay: "2026-04-16" })
    expect(payWeek(sixPmAest, ANCHOR).afterCutoff).toBe(false)
    expect(payWeek(new Date("2026-04-15T08:01:00.000Z"), ANCHOR)).toMatchObject({
      start: "2026-04-16",
      end: "2026-04-22",
      payDay: "2026-04-23",
      afterCutoff: true,
    })
  })

  it("keeps a seven-day week through both Sydney daylight-saving changes", () => {
    for (const day of ["2026-10-04", "2026-04-05"]) {
      const week = weekOf(day)
      expect(datesInWeek(week)).toHaveLength(7)
      expect(isThursday(week.start)).toBe(true)
      expect(isThursday(week.payDay)).toBe(true)
      expect(week.end >= day && week.start <= day).toBe(true)
    }
    expect(weekOf("2026-10-04")).toMatchObject({ start: "2026-10-01", end: "2026-10-07", payDay: "2026-10-08" })
    expect(weekOf("2026-04-05")).toMatchObject({ start: "2026-04-02", end: "2026-04-08", payDay: "2026-04-09" })
    expect(sydneyParts(new Date("2026-10-04T07:00:00.000Z"))).toMatchObject({ iso: "2026-10-04", minutes: 18 * 60 })
    expect(sydneyParts(new Date("2026-04-05T08:00:00.000Z"))).toMatchObject({ iso: "2026-04-05", minutes: 18 * 60 })
  })

  it("reminds on the closing Wednesday and pays the closed week on Thursday morning", () => {
    const wednesday = new Date("2026-11-11T05:40:00.000Z")
    expect(sydneyParts(wednesday)).toMatchObject({ iso: "2026-11-11", minutes: 16 * 60 + 40 })
    expect(timesheetReminder({ now: wednesday, hasShiftToday: true, signedToday: false })).toBe("cutoff")
    expect(timesheetReminder({ now: wednesday, hasShiftToday: true, signedToday: true })).toBeNull()
    expect(timesheetReminder({ now: new Date("2026-11-11T04:29:00.000Z"), hasShiftToday: true, signedToday: false })).toBeNull()
    expect(timesheetReminder({ now: new Date("2026-11-11T04:30:00.000Z"), hasShiftToday: true, signedToday: false })).toBe("daily")
    const thursdayAfternoon = new Date("2026-11-12T04:40:00.000Z")
    expect(sydneyParts(thursdayAfternoon).minutes).toBe(15 * 60 + 40)
    expect(timesheetReminder({ now: thursdayAfternoon, hasShiftToday: true, signedToday: false })).toBe("daily")
    expect(timesheetIsSigned({ status: "Submitted", signaturePng: "data:image/png;base64,abc" })).toBe(true)
    expect(timesheetIsSigned({ status: "Submitted" })).toBe(false)
    expect(timesheetIsSigned({ status: "Approved" })).toBe(true)
    expect(formatLongDate("2026-11-12")).toBe("Thursday 12 November 2026")
  })

  it("uses a Thursday anchor and falls back when the setting is not one", () => {
    vi.stubEnv("PORTAL_PAY_ANCHOR", "5/11/2026")
    expect(payAnchor()).toBe("2026-11-05")
    vi.stubEnv("PORTAL_PAY_ANCHOR", "2026-11-04")
    expect(payAnchor()).toBe(DEFAULT_PAY_ANCHOR)
    vi.stubEnv("PORTAL_PAY_ANCHOR", "2026-02-31")
    expect(payAnchor()).toBe(DEFAULT_PAY_ANCHOR)
    expect(parseCalendarDate("02/01/2000")).toBe("2000-01-02")
    expect(parseCalendarDate("2000-01-02")).toBe("2000-01-02")
    expect(parseCalendarDate("31/02/2000")).toBeNull()
  })

  it("stores onboarding dates from a date picker or an Australian date", async () => {
    const now = new Date("2026-10-17T01:00:00.000Z")
    const store = createMemoryStore({ seed: true, now })
    const ctx: Ctx = { store, now, mode: "mock", notify: createNotify(store, "mock") }
    const saved = await saveOnboarding(ctx, "w-sam", { dob: "02/01/2000", visaExpiry: "2027-06-01", availableFrom: "1/12/2026" })
    expect(saved.ok).toBe(true)
    const worker = await store.workers.get("w-sam")
    expect(worker?.dob).toBe("2000-01-02")
    expect(worker?.visaExpiry).toBe("2027-06-01")
    expect(worker?.availableFrom).toBe("2026-12-01")
    const bad = await saveOnboarding(ctx, "w-sam", { dob: "not a date" })
    expect(bad.ok).toBe(false)
    if (!bad.ok) expect(bad.error).toMatch(/date of birth/i)
    expect((await store.workers.get("w-sam"))?.dob).toBe("2000-01-02")
    const future = await saveOnboarding(ctx, "w-sam", { dob: "2099-01-01" })
    expect(future.ok).toBe(false)
    const notion = toNotionProperties({ "Date of birth": "02/01/2000", "Visa expiry": "nope", "Work date": "2026-11-05T07:00:00.000Z" })
    expect(notion["Date of birth"]).toEqual({ date: { start: "2000-01-02" } })
    expect(notion["Visa expiry"]).toBeUndefined()
    expect(notion["Work date"]).toEqual({ date: { start: "2026-11-05T07:00:00.000Z" } })
  })

  it("emails the closed week on Thursday morning and skips a timesheet that is already signed", async () => {
    const thursday = new Date("2026-11-11T21:15:00.000Z")
    const store = createMemoryStore({ seed: true, now: thursday })
    const ctx: Ctx = { store, now: thursday, mode: "mock", notify: createNotify(store, "mock") }
    const offer = await store.offers.get("offer-sam-yest")
    if (!offer) throw new Error("missing offer")
    offer.siteEmail = "site@example.com"
    await store.offers.save(offer)
    const sheet = await store.timesheets.get("ts-sam-yest")
    if (!sheet) throw new Error("missing timesheet")
    sheet.payFortnight = "2026-11-05 to 2026-11-11"
    sheet.payDay = "2026-11-12"
    sheet.status = "Approved"
    await store.timesheets.save(sheet)
    const sent = await runReminders(ctx)
    expect(sent.ok).toBe(true)
    const notes = await store.notifications.all()
    const summary = notes.find((note) => note.subject === "Hours for 2026-11-05 to 2026-11-11")
    expect(summary?.to).toBe("site@example.com")
    expect(summary?.body).toContain("2026-11-05 to 2026-11-11")
    expect(summary?.body).not.toContain("2026-11-19")

    const wednesday = new Date("2026-11-11T05:40:00.000Z")
    const afternoon = createMemoryStore({ seed: true, now: wednesday })
    const afternoonCtx: Ctx = { store: afternoon, now: wednesday, mode: "mock", notify: createNotify(afternoon, "mock") }
    const todaySheet = await afternoon.timesheets.get("ts-sam-yest")
    if (!todaySheet) throw new Error("missing timesheet")
    const todayOffer = await afternoon.offers.get("offer-sam-today")
    if (!todayOffer) throw new Error("missing shift")
    todaySheet.workDate = todayOffer.shiftDate
    todaySheet.status = "Submitted"
    todaySheet.signaturePng = "data:image/png;base64,abc"
    await afternoon.timesheets.save(todaySheet)
    await runReminders(afternoonCtx)
    const reminded = (await afternoon.notifications.all()).filter((note) => note.subject === "Today's hours")
    expect(reminded).toEqual([])
  })
})
