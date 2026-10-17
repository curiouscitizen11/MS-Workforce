import { addDays, sydneyToday } from "@/lib/portal/dates"
import { payFortnight } from "@/lib/portal/pay"
import { blankTickets, type Offer, type PortalDocument, type StoredBlob, type Timesheet, type Worker } from "@/lib/portal/types"

export const SEED_VERSION = 2

export const DEMO_SIGNATURE =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="90" viewBox="0 0 320 90"><path d="M12 58c28-36 42-8 58 2 18 12 14-30 36-28 22 2 8 40 28 36 18-4 22-40 46-24 20 14 8 32 30 24" fill="none" stroke="#0A2540" stroke-width="2.5" stroke-linecap="round"/><path d="M210 60c18-8 30-2 46 4" fill="none" stroke="#0A2540" stroke-width="2" stroke-linecap="round"/></svg>',
  )

const TINY_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

export type SeedData = {
  version: number
  workers: Worker[]
  offers: Offer[]
  timesheets: Timesheet[]
  documents: PortalDocument[]
  blobs: StoredBlob[]
  sessions: []
  challenges: []
  magics: []
  outbox: []
  notifications: []
  audits: []
  attempts: []
  records: []
  reminders: []
}

function baseWorker(partial: Pick<Worker, "id" | "name" | "mobile" | "status"> & Partial<Worker>, nowIso: string): Worker {
  return {
    role: "worker",
    roles: [],
    whatsappOk: false,
    privacyConsent: true,
    tickets: blankTickets(),
    createdAt: nowIso,
    updatedAt: nowIso,
    ...partial,
  }
}

export function buildSeed(now = new Date()): SeedData {
  const today = sydneyToday(now)
  const tomorrow = addDays(today, 1)
  const yesterday = addDays(today, -1)
  const nowIso = now.toISOString()
  const later = new Date(now.getTime() + 36 * 60 * 60 * 1000).toISOString()

  const mav = baseWorker(
    {
      id: "w-mav",
      role: "admin",
      name: "Mav",
      mobile: "+61400000001",
      email: "hello@msworkforce.au",
      suburb: "Northern Beaches",
      status: "Ready",
      rightToWork: "Yes",
    },
    nowIso,
  )

  const sam = baseWorker(
    {
      id: "w-sam",
      name: "Sam Lee",
      mobile: "+61400111222",
      email: "sam.lee@example.com",
      suburb: "Dee Why",
      status: "Ready",
      roles: ["General labourer"],
      experience: "Two years on residential frames and site cleans.",
      whatsappOk: true,
      rtw: "Australian citizen",
      rightToWork: "Yes",
      transport: "Own car",
      fitness: "Yes, I can safely do these tasks",
      healthConsent: true,
      policiesAck: true,
      contractAccepted: true,
      onboardingSubmitted: addDays(today, -20),
      termsSignedOn: addDays(today, -20),
      formStatus: "Onboarding complete",
      inductionPassed: addDays(today, -20),
      inductionScore: 8,
      inductionVersion: "v1.0",
      ticketsVerified: true,
      verifiedOn: addDays(today, -2),
      verifiedBy: "Mav",
      verificationMethod: "Sighted original",
      tickets: {
        ...blankTickets(),
        whiteCard: { status: "Held", number: "WC-102938", state: "NSW" },
        heights: { status: "Held", number: "HT-2201", expiry: addDays(today, 20) },
        firstAid: { status: "Held", number: "FA-5521", expiry: addDays(today, 50) },
        driverLicence: { status: "Car", expiry: addDays(today, 400) },
      },
    },
    nowIso,
  )

  const alex = baseWorker(
    {
      id: "w-alex",
      name: "Alex Nguyen",
      mobile: "+61400333444",
      email: "alex.nguyen@example.com",
      suburb: "Marrickville",
      status: "Ready",
      roles: ["General labourer"],
      rightToWork: "Yes",
      ticketsVerified: true,
      tickets: { ...blankTickets(), whiteCard: { status: "Expired", expiry: addDays(today, -3) } },
    },
    nowIso,
  )

  const priya = baseWorker(
    {
      id: "w-priya",
      name: "Priya Shah",
      mobile: "+61400555666",
      email: "priya.shah@example.com",
      suburb: "Parramatta",
      status: "Ready",
      roles: ["Trade assistant"],
      rightToWork: "Yes",
      rtw: "Visa holder",
      vevoConsent: true,
      visaSubclass: "482",
      visaExpiry: addDays(today, 200),
      tickets: {
        ...blankTickets(),
        whiteCard: { status: "Held", state: "NSW" },
        asbestosB: { status: "Expired", expiry: addDays(today, -1) },
      },
    },
    nowIso,
  )

  const jordan = baseWorker(
    {
      id: "w-jordan",
      name: "Jordan Blake",
      mobile: "+61400777888",
      suburb: "Brookvale",
      status: "Ready",
      roles: ["General labourer"],
      rightToWork: "Yes",
      tickets: {
        ...blankTickets(),
        whiteCard: { status: "Held", state: "NSW" },
        heights: { status: "Expired", expiry: addDays(today, -12) },
      },
    },
    nowIso,
  )

  const casey = baseWorker(
    {
      id: "w-casey",
      name: "Casey Morgan",
      mobile: "+61400999000",
      email: "casey.morgan@example.com",
      suburb: "Manly",
      status: "Applicant",
      roles: ["Site clean"],
      experience: "Keen to start. Finished school last year.",
      whatsappOk: true,
      tickets: { ...blankTickets(), whiteCard: { status: "Held", state: "NSW" } },
    },
    nowIso,
  )

  const site = {
    siteName: "Brookvale frame stage",
    siteContact: "Pat Riley",
    sitePhone: "+61400222333",
    address: "12 Smith St, Brookvale NSW 2100",
    inductionMethod: "HammerTech",
    inductionLink: "https://example.com/site-induction",
    signInMethod: "HammerTech QR at the gate",
    bring: "Steel-cap boots, hi-vis, a hard hat, safety glasses and gloves. The site does not supply these.",
    highRisk: "Open edges on level 2. Stay behind the rails.",
    parking: "Street parking on Smith St. Do not block the driveway.",
    usualFinish: "15:30",
    usualBreak: 30,
    timesheetSigner: "Pat Riley",
    signerRole: "Site supervisor",
    requiredTickets: ["whiteCard"] as Offer["requiredTickets"],
    expectedHours: 8,
    startTime: "07:00",
    roleName: "Labourer",
    rateToWorker: "$42 an hour",
    createdBy: "w-mav",
  }

  const offers: Offer[] = [
    {
      id: "offer-sam-open",
      placementRef: "P-2026-018",
      workerId: "w-sam",
      suburb: "Dee Why",
      shiftDate: tomorrow,
      status: "Offered",
      expiresAt: later,
      sentAt: nowIso,
      ...site,
      siteName: undefined,
      address: undefined,
      siteContact: undefined,
      sitePhone: undefined,
    },
    {
      id: "offer-sam-today",
      placementRef: "P-2026-017",
      workerId: "w-sam",
      suburb: "Brookvale",
      shiftDate: today,
      status: "Accepted",
      expiresAt: later,
      sentAt: nowIso,
      respondedAt: nowIso,
      ...site,
    },
    {
      id: "offer-sam-yest",
      placementRef: "P-2026-017",
      workerId: "w-sam",
      suburb: "Brookvale",
      shiftDate: yesterday,
      status: "Accepted",
      expiresAt: later,
      sentAt: nowIso,
      respondedAt: nowIso,
      ...site,
    },
    {
      id: "offer-alex-open",
      placementRef: "P-2026-018",
      workerId: "w-alex",
      suburb: "Dee Why",
      shiftDate: tomorrow,
      status: "Offered",
      expiresAt: later,
      sentAt: nowIso,
      requiredTickets: ["whiteCard"],
      expectedHours: 8,
      startTime: "07:00",
      roleName: "Labourer",
      rateToWorker: "$42 an hour",
      createdBy: "w-mav",
    },
    {
      id: "offer-jordan-heights",
      placementRef: "P-2026-019",
      workerId: "w-jordan",
      suburb: "Artarmon",
      shiftDate: tomorrow,
      status: "Offered",
      expiresAt: later,
      sentAt: nowIso,
      requiredTickets: ["whiteCard", "heights"],
      expectedHours: 8,
      startTime: "07:00",
      roleName: "Labourer",
      rateToWorker: "$42 an hour",
      createdBy: "w-mav",
    },
  ]

  const paid = payFortnight(now)
  const timesheets: Timesheet[] = [
    {
      id: "ts-sam-yest",
      workerId: "w-sam",
      offerId: "offer-sam-yest",
      placementRef: "P-2026-017",
      workDate: yesterday,
      start: "07:00",
      finish: "15:30",
      breakMinutes: 30,
      totalHours: 8,
      tasks: ["Carrying materials"],
      incident: false,
      status: "Approved",
      supervisorName: "Pat Riley",
      supervisorRole: "Site supervisor",
      plannedSigner: "Pat Riley",
      signerMismatch: false,
      signaturePng: DEMO_SIGNATURE,
      approvedAt: nowIso,
      payFortnight: paid.label,
      payDay: paid.payDay,
      afterCutoff: paid.afterCutoff,
      source: "Portal",
      workerName: "Sam Lee",
      siteName: "Brookvale frame stage",
      suburb: "Brookvale",
      confirmationSentAt: nowIso,
    },
  ]

  const documents: PortalDocument[] = [
    {
      id: "doc-sam-white",
      workerId: "w-sam",
      kind: "id",
      contentType: "image/png",
      bytes: Buffer.from(TINY_PNG, "base64").length,
      createdAt: nowIso,
      verifiedAt: addDays(today, -2) + "T00:00:00.000Z",
    },
  ]

  const blobs: StoredBlob[] = [{ id: "doc-sam-white", contentType: "image/png", base64: TINY_PNG }]

  return {
    version: SEED_VERSION,
    workers: [mav, sam, alex, priya, jordan, casey],
    offers,
    timesheets,
    documents,
    blobs,
    sessions: [],
    challenges: [],
    magics: [],
    outbox: [],
    notifications: [],
    audits: [],
    attempts: [],
    records: [],
    reminders: [],
  }
}
