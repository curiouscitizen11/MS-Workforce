import { describe, expect, it } from "vitest"
import { checkBookLabour, placementProperties } from "@/lib/portal/book-labour"
import { hoursSignStamp } from "@/lib/portal/hours"
import { workerNotionProperties } from "@/lib/portal/notion/map"
import { createNotify } from "@/lib/portal/notify"
import {
  finishJoin,
  prepareJoin,
  requestEmailOtp,
  saveTicketPhoto,
  submitApplication,
  submitBookLabour,
  submitTimesheet,
  verifyEmailOtp,
  type Ctx,
} from "@/lib/portal/services"
import { createMemoryStore } from "@/lib/portal/store"
import { DRIVER_ROLES, LABOUR_ROLES, PLANT_ROLES } from "@/lib/portal/types"

const NOW = new Date("2026-11-24T01:00:00.000Z")
const WORKER = (n: number) => "msworkforce.ops+worker" + n + "@mail.grokbot.com"
const CLIENT = (n: number) => "msworkforce.ops+client" + n + "@mail.grokbot.com"

function harness(now = NOW) {
  const calls: string[] = []
  const fetchImpl: typeof fetch = async (input) => {
    calls.push(String(input))
    throw new Error("no network")
  }
  const store = createMemoryStore({ seed: true, now })
  const ctx: Ctx = { store, now, mode: "mock", notify: createNotify(store, "mock", fetchImpl) }
  return { ctx, calls }
}

function tickets(extra: Record<string, string> = {}) {
  return {
    whiteCard: "No",
    heights: "No",
    asbestosA: "No",
    asbestosB: "No",
    confinedSpace: "No",
    firstAid: "No",
    driverLicence: "No",
    ...extra,
  }
}

const workers = [
  { n: 1, name: "Ava Nguyen", mobile: "0499 100 001", suburb: "Manly", roles: [LABOUR_ROLES[0]], licence: "" },
  { n: 2, name: "Ben Okafor", mobile: "0499 100 002", suburb: "Dee Why", roles: [LABOUR_ROLES[1], LABOUR_ROLES[2]], licence: "" },
  { n: 3, name: "Chi Walsh", mobile: "0499 100 003", suburb: "Brookvale", roles: [PLANT_ROLES[0]], licence: "VOC" },
  { n: 4, name: "Dan Petrov", mobile: "0499 100 004", suburb: "Mona Vale", roles: [PLANT_ROLES[6]], licence: "LF" },
  { n: 5, name: "Eva Rossi", mobile: "0499 100 005", suburb: "Narrabeen", roles: [DRIVER_ROLES[1]], licence: "HR" },
  { n: 6, name: "Finn Clarke", mobile: "0499 100 006", suburb: "Collaroy", roles: [DRIVER_ROLES[2]], licence: "HC" },
  { n: 7, name: "Gia Patel", mobile: "0499 100 007", suburb: "Freshwater", roles: [LABOUR_ROLES[3], "Other, please explain"], licence: "" },
  { n: 8, name: "Hugo Berg", mobile: "0499 100 008", suburb: "Curl Curl", roles: [PLANT_ROLES[1], DRIVER_ROLES[0]], licence: "Bobcat VOC" },
  { n: 9, name: "Ivy Chen", mobile: "0499 100 009", suburb: "Allambie", roles: [LABOUR_ROLES[0], PLANT_ROLES[2]], licence: "Roller" },
  { n: 10, name: "Jo Nguyen-Smith", mobile: "0499 100 010", suburb: "Beacon Hill", roles: [LABOUR_ROLES[0]], licence: "" },
]

describe("demo sign-ups, bookings and codes", () => {
  it("signs up ten different workers and keeps their roles and licence note", async () => {
    const { ctx, calls } = harness()
    for (const person of workers) {
      const sent = await prepareJoin(
        ctx,
        {
          name: person.name,
          mobile: person.mobile,
          email: WORKER(person.n),
          confirmEmail: WORKER(person.n),
          suburb: person.suburb,
          postcode: "2095",
          roles: person.roles,
          roleLicence: person.licence,
          experience: "Keen to start.",
          privacyConsent: true,
        },
        "203.0.113." + (20 + person.n),
      )
      expect(sent.ok, person.name).toBe(true)
      if (!sent.ok || !sent.devCode) throw new Error(person.name)
      const done = await finishJoin(ctx, sent.draft, sent.devCode)
      expect(done.ok, person.name).toBe(true)
      const saved = (await ctx.store.workers.all()).find((worker) => worker.email === WORKER(person.n))
      expect(saved?.roles).toEqual(person.roles)
      expect(saved?.roleLicence || "").toBe(person.licence)
      const queued = (await ctx.store.outbox.all()).filter((item) => item.kind === "workers").at(-1)
      const props = (queued?.payload as { properties: Record<string, unknown> }).properties
      expect(props["Roles of interest"]).toEqual(
        person.roles.map((role) => (role === "Other, please explain" ? "Other – please explain" : role)),
      )
      if (person.licence) expect(String(props.Notes)).toContain("Licence or ticket held: " + person.licence)
      expect(queued?.status).toBe("skipped-mock")
    }
    const mail = await ctx.store.notifications.all()
    expect(mail.filter((item) => item.channel === "email" && item.to?.includes("@mail.grokbot.com"))).toHaveLength(10)
    expect(mail.every((item) => item.status === "captured")).toBe(true)
    expect(calls).toEqual([])
    expect((await ctx.store.workers.all()).some((worker) => worker.roles.includes("Site clean"))).toBe(true)
  })

  it("accepts a full apply and rejects a bad email, a bad mobile and a blank role", async () => {
    const { ctx } = harness()
    const badEmail = await submitApplication(ctx, {
      name: "Kim Lee",
      mobile: "0499 100 011",
      email: "not-an-email",
      confirmEmail: "not-an-email",
      suburb: "Manly",
      roles: ["General labourer"],
      experience: "",
      whatsappOk: false,
      privacyConsent: true,
      tickets: tickets(),
    })
    expect(badEmail.ok).toBe(false)
    const badMobile = await submitApplication(ctx, {
      name: "Kim Lee",
      mobile: "123",
      email: WORKER(1),
      confirmEmail: WORKER(1),
      suburb: "Manly",
      roles: ["General labourer"],
      experience: "",
      whatsappOk: false,
      privacyConsent: true,
      tickets: tickets(),
    })
    expect(badMobile.ok).toBe(false)
    const noRole = await submitApplication(ctx, {
      name: "Kim Lee",
      mobile: "0499 100 011",
      email: WORKER(1),
      confirmEmail: WORKER(1),
      suburb: "Manly",
      roles: [],
      experience: "",
      whatsappOk: false,
      privacyConsent: true,
      tickets: tickets(),
    })
    expect(noRole.ok).toBe(false)
    const applied = await submitApplication(ctx, {
      name: "Kim Lee",
      mobile: "0499 100 011",
      email: WORKER(1),
      confirmEmail: WORKER(1),
      suburb: "Manly",
      roles: ["Excavator"],
      roleLicence: "VOC",
      experience: "Two years on residential frames.",
      whatsappOk: true,
      privacyConsent: true,
      tickets: tickets({ whiteCard: "Yes, I have it" }),
    })
    expect(applied.ok).toBe(true)
    const row = (await ctx.store.workers.all()).find((worker) => worker.email === WORKER(1))
    expect(row?.roleLicence).toBe("VOC")
    expect(row?.tickets.whiteCard.status).toBe("Yes, I have it")
  })

  it("accepts jpg, png and heic ticket photos and rejects a huge file and a gif", async () => {
    const { ctx } = harness()
    const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(32, 1)])
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(16, 2)])
    const heic = Buffer.alloc(24, 0)
    heic.write("ftypheic", 4, "ascii")
    const gif = Buffer.from("GIF89a", "ascii")
    const big = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(8 * 1024 * 1024 + 1, 3)])
    expect((await saveTicketPhoto(ctx, "w-sam", { bytes: jpeg, licenceKey: "whiteCard", side: "front" })).ok).toBe(true)
    expect((await saveTicketPhoto(ctx, "w-sam", { bytes: png, licenceKey: "whiteCard", side: "back" })).ok).toBe(true)
    expect((await saveTicketPhoto(ctx, "w-sam", { bytes: heic, licenceKey: "heights", side: "front" })).ok).toBe(true)
    const huge = await saveTicketPhoto(ctx, "w-sam", { bytes: big, licenceKey: "whiteCard", side: "front" })
    expect(huge.ok).toBe(false)
    if (!huge.ok) expect(huge.error).toMatch(/8 MB/)
    const wrong = await saveTicketPhoto(ctx, "w-sam", { bytes: gif, licenceKey: "whiteCard", side: "front" })
    expect(wrong.ok).toBe(false)
    if (!wrong.ok) expect(wrong.error).toMatch(/JPG, PNG or HEIC/)
    const docs = (await ctx.store.documents.all()).filter((doc) => doc.id.startsWith("doc_"))
    expect(docs.map((doc) => doc.contentType).sort()).toEqual(["image/heic", "image/jpeg", "image/png"])
  })

  it("accepts the right email code, rejects a wrong or expired code, and allows a resend", async () => {
    const { ctx } = harness()
    const sent = await prepareJoin(
      ctx,
      {
        name: "Ava Nguyen",
        mobile: "0499 100 001",
        email: WORKER(1),
        confirmEmail: WORKER(1),
        suburb: "Manly",
        postcode: "2095",
        roles: ["General labourer"],
        experience: "",
        privacyConsent: true,
      },
      "203.0.113.80",
    )
    expect(sent.ok).toBe(true)
    if (!sent.ok || !sent.devCode) throw new Error("missing code")
    expect((await finishJoin(ctx, sent.draft, "000000")).ok).toBe(false)
    expect((await finishJoin(ctx, sent.draft, sent.devCode)).ok).toBe(true)
    const first = await requestEmailOtp(ctx, { email: WORKER(1), ip: "203.0.113.81" })
    expect(first.ok).toBe(true)
    if (!first.ok) return
    expect((await verifyEmailOtp(ctx, { email: WORKER(1), code: "111111" })).ok).toBe(false)
    const again = await requestEmailOtp(ctx, { email: WORKER(1), ip: "203.0.113.81" })
    expect(again.ok).toBe(true)
    if (!again.ok || !again.devCode) return
    const openCodes = (await ctx.store.challenges.all()).filter((item) => item.target === WORKER(1) && !item.consumedAt)
    expect(openCodes.length).toBeGreaterThan(1)
    for (const item of openCodes) {
      item.expiresAt = new Date(NOW.getTime() - 1000).toISOString()
      await ctx.store.challenges.save(item)
    }
    const expired = await verifyEmailOtp(ctx, { email: WORKER(1), code: again.devCode })
    expect(expired.ok).toBe(false)
    if (!expired.ok) expect(expired.error).toMatch(/expired/)
    const emails = (await ctx.store.notifications.all()).filter((item) => item.to === WORKER(1))
    expect(emails.every((item) => item.status === "captured" && item.body === "Login code sent")).toBe(true)
  })

  it("books ten labour requests and checks the text roles field, dates and counts", async () => {
    const { ctx, calls } = harness()
    const jobs = [
      { n: 1, roles: "3 general labourers and 1 trade assistant for demo work", workers: 4, ongoing: false, end: "2026-12-01" },
      { n: 2, roles: "Excavator operator for a house pad", workers: 1, ongoing: true, end: "" },
      { n: 3, roles: "Water cart all week", workers: 1, ongoing: false, end: "2026-12-05" },
      { n: 4, roles: "Tipper for spoil, plus a spotter", workers: 2, ongoing: false, end: "2026-12-02" },
      { n: 5, roles: "Forklift to unload a container", workers: 1, ongoing: true, end: "" },
      { n: 6, roles: "General labour for a strip-out", workers: 6, ongoing: false, end: "2026-12-10" },
      { n: 7, roles: "Skid steer and a labourer", workers: 2, ongoing: false, end: "2026-12-03" },
      { n: 8, roles: "HR truck for a tip run", workers: 1, ongoing: true, end: "" },
      { n: 9, roles: "Two labourers, one with a white card only", workers: 2, ongoing: false, end: "2026-12-04" },
      { n: 10, roles: "Crew for a Saturday clean-up", workers: 8, ongoing: false, end: "2026-12-06" },
    ]
    for (const job of jobs) {
      const sent = await submitBookLabour(
        ctx,
        {
          company: "Client " + job.n + " Build",
          name: "Client Contact " + job.n,
          phone: "029999000" + (job.n % 10),
          email: CLIENT(job.n),
          address: job.n + " Harbour Street",
          suburb: "Manly",
          roles: job.roles,
          workers: job.workers,
          start: "2026-11-26",
          ongoing: job.ongoing,
          end: job.end,
          shift: "Mon–Fri, 7:00 am start",
          notes: job.n === 1 ? "Please call about parking." : "",
          heard: "Google",
          companyWebsite: "",
          startedAt: NOW.getTime() - 10_000,
        },
        "203.0.113." + (100 + job.n),
      )
      expect(sent.ok, job.roles).toBe(true)
      const queued = (await ctx.store.outbox.all()).filter((item) => item.kind === "placements").at(-1)
      const props = (queued?.payload as { properties: Record<string, unknown> }).properties
      expect(props["Roles requested"]).toBe(job.roles)
      expect(typeof props["Roles requested"]).toBe("string")
      expect(props["Site email"]).toBe(CLIENT(job.n))
      expect(props["Workers needed"]).toBe(job.workers)
      expect(props["Open ended"]).toBe(job.ongoing)
      expect(queued?.status).toBe("skipped-mock")
    }
    expect((await submitBookLabour(ctx, baseBook({ workers: 0 }), "203.0.113.90")).ok).toBe(false)
    expect((await submitBookLabour(ctx, baseBook({ workers: 80 }), "203.0.113.90")).ok).toBe(false)
    expect((await submitBookLabour(ctx, baseBook({ end: "2026-11-01" }), "203.0.113.91")).ok).toBe(false)
    expect((await submitBookLabour(ctx, baseBook({ roles: "" }), "203.0.113.92")).ok).toBe(false)
    expect((await submitBookLabour(ctx, baseBook({ email: "nope" }), "203.0.113.93")).ok).toBe(false)
    expect((await submitBookLabour(ctx, baseBook({ phone: "123" }), "203.0.113.94")).ok).toBe(false)
    const long = "x".repeat(2000)
    const trimmed = await checkBookLabour(baseBook({ roles: long, company: "y".repeat(300) }), NOW.getTime())
    expect(trimmed.ok).toBe(true)
    if (trimmed.ok && !("ignored" in trimmed)) {
      expect(trimmed.value.roles.length).toBe(1000)
      expect(trimmed.value.company.length).toBe(120)
    }
    const emoji = await submitBookLabour(ctx, baseBook({ roles: "2 labourers 🚧", notes: "Gate code #12" }), "203.0.113.95")
    expect(emoji.ok).toBe(true)
    const past = await submitBookLabour(ctx, baseBook({ start: "2020-01-01", end: "2020-01-02" }), "203.0.113.96")
    expect(past.ok).toBe(true)
    const duplicate = baseBook({ company: "Double Tap Build", email: CLIENT(2), startedAt: NOW.getTime() - 10_000 })
    expect((await submitBookLabour(ctx, duplicate, "203.0.113.70")).ok).toBe(true)
    expect((await submitBookLabour(ctx, duplicate, "203.0.113.70")).ok).toBe(true)
    const copies = (await ctx.store.outbox.all()).filter((item) => JSON.stringify(item.payload).includes("Double Tap Build"))
    expect(copies).toHaveLength(2)
    expect(calls).toEqual([])
    const alert = (await ctx.store.notifications.all()).find((item) => item.subject?.includes("Client 1 Build"))
    expect(alert?.status).toBe("captured")
    expect(alert?.body).toContain("3 general labourers")
    const sample = placementProperties(
      {
        company: "Client 1 Build",
        name: "Client Contact 1",
        phone: "0299990001",
        email: CLIENT(1),
        address: "1 Harbour Street",
        suburb: "Manly",
        roles: jobs[0].roles,
        workers: 4,
        start: "2026-11-26",
        ongoing: false,
        end: "2026-12-01",
        shift: "Mon–Fri, 7:00 am start",
        notes: "Please call about parking.",
        heard: "Google",
      },
      "lr_demo",
    )
    expect(sample["Roles requested"]).toBe(jobs[0].roles)
  })

  it("rejects a timesheet signature that does not match the hours", async () => {
    const { ctx } = harness()
    const hours = {
      workerId: "w-sam",
      offerId: "offer-sam-today",
      workDate: "2026-11-24",
      start: "07:00",
      finish: "15:30",
      breakMinutes: 30,
      breakStart: "12:00",
      tasks: "Carried materials",
      incident: false,
      workerConfirmed: true,
      supervisorName: "Pat Riley",
      supervisorEmail: "pat.riley@example.com",
      supervisorRole: "Site supervisor",
      supervisorConfirmed: true,
      signaturePng: "data:image/png;base64,abc",
    }
    const offer = await ctx.store.offers.get("offer-sam-today")
    if (!offer) throw new Error("missing shift")
    offer.shiftDate = "2026-11-24"
    await ctx.store.offers.save(offer)
    const mismatched = await submitTimesheet(ctx, { ...hours, signedHours: "07:00|15:00|30|12:00" })
    expect(mismatched.ok).toBe(false)
    const matched = await submitTimesheet(ctx, { ...hours, signedHours: hoursSignStamp(hours) })
    expect(matched.ok).toBe(true)
    const sheet = (await ctx.store.timesheets.all()).find((item) => item.workerId === "w-sam" && item.workDate === "2026-11-24")
    const notion = workerNotionProperties((await ctx.store.workers.get("w-sam"))!)
    expect(notion.Name).toBe("Sam Lee")
    expect(sheet?.signaturePng?.startsWith("data:image/")).toBe(true)
    const queued = (await ctx.store.outbox.all()).filter((item) => item.kind === "timesheets").at(-1)
    expect(JSON.stringify(queued?.payload)).not.toContain("data:image")
  })
})

function baseBook(extra: Record<string, unknown> = {}) {
  return {
    company: "Harbour Build",
    name: "Alex Stone",
    phone: "02 9999 0000",
    email: CLIENT(1),
    address: "12 Harbour Street",
    suburb: "Manly",
    roles: "2 general labourers",
    workers: 2,
    start: "2026-11-26",
    ongoing: false,
    end: "2026-11-27",
    shift: "Day shift",
    notes: "",
    heard: "",
    companyWebsite: "",
    startedAt: NOW.getTime() - 10_000,
    ...extra,
  }
}
