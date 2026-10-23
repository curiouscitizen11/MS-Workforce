export const TICKET_TYPES = [
  "whiteCard",
  "heights",
  "asbestosA",
  "asbestosB",
  "confinedSpace",
  "firstAid",
  "driverLicence",
  "other",
] as const

export type TicketType = (typeof TICKET_TYPES)[number]

export const TICKET_LABELS: Record<TicketType, string> = {
  whiteCard: "White card",
  heights: "Work at heights",
  asbestosA: "Asbestos Class A",
  asbestosB: "Asbestos Class B",
  confinedSpace: "Confined space",
  firstAid: "First aid",
  driverLicence: "Driver licence",
  other: "Other ticket",
}

export const TICKET_ANSWERS = ["Yes, I have it", "No", "Booked in for the course"] as const

export const WORKER_STATUSES = ["Applicant", "Onboarding", "Ready", "Inactive"] as const
export type WorkerStatus = (typeof WORKER_STATUSES)[number]

export const ROLES = [
  "General labourer",
  "Trade assistant",
  "Site clean",
  "Materials handling",
  "Demolition / strip-out",
  "Concrete labourer",
  "Asbestos removal labourer (Class B)",
  "Landscaping labourer",
  "Other, please explain",
] as const

export const TRANSPORT_OPTIONS = [
  "Own car",
  "Public transport",
  "Lift / carpool",
  "Motorbike or bicycle",
  "Other, please explain",
] as const

export const FITNESS_OPTIONS = [
  "Yes, I can safely do these tasks",
  "Yes, with some adjustments (please call me)",
  "Not sure, please call me",
] as const

export const RTW_OPTIONS = [
  "Australian citizen",
  "Permanent resident",
  "New Zealand citizen",
  "Visa holder",
  "Other, please explain",
] as const

export const EXPERIENCE_LEVELS = [
  "No construction experience yet",
  "Under 6 months",
  "6–12 months",
  "1–2 years",
  "3–5 years",
  "More than 5 years",
  "Other, please explain",
] as const

export const WORK_AREAS = [
  "Northern Beaches",
  "North Shore",
  "Sydney CBD and inner city",
  "Eastern Suburbs",
  "Inner West",
  "Hills District",
  "Parramatta and Western Sydney",
  "South West Sydney",
  "Sutherland Shire and St George",
  "Central Coast",
  "Anywhere in Greater Sydney",
  "Other, please explain",
] as const

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Short notice OK", "Other, please explain"] as const

export const CONSTRUCTION_RECENT = ["Yes", "No", "Not sure"] as const

export const LICENCE_STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT", "Overseas", "Other, please explain"] as const

export const OTHER_TICKETS = [
  "Asbestos awareness",
  "Silica awareness",
  "Manual handling",
  "Forklift (LF)",
  "EWP over 11 m (WP licence)",
  "EWP under 11 m (yellow card)",
  "Telehandler",
  "Dogging (DG)",
  "Basic rigging (RB)",
  "Basic scaffolding (SB)",
  "Plant ticket (excavator, skid steer, roller)",
  "Test and tag",
  "None of these",
  "Other, please explain",
] as const

export const ALLERGY_ANSWERS = ["No", "Yes", "I'd rather tell MS Workforce by phone"] as const

export const ALLERGY_TYPES = [
  "Bee or wasp stings",
  "Other insect bites",
  "Foods (e.g. nuts, shellfish)",
  "Medicines (e.g. penicillin)",
  "Latex",
  "Plants or pollen",
  "Dust or chemicals",
  "Other, please explain",
] as const

export const ANAPHYLAXIS_ANSWERS = ["No", "Yes", "Not sure"] as const

export const EPIPEN_ANSWERS = ["No", "Yes, I always carry it", "Yes, but not always"] as const

export const MEDICAL_CONDITIONS = [
  "No",
  "Asthma",
  "Diabetes",
  "Epilepsy or seizures",
  "Heart condition",
  "Fainting or blackouts",
  "Hearing or vision condition that affects safety",
  "I'd rather tell MS Workforce by phone",
  "Other, please explain",
] as const

export const INJURY_ANSWERS = [
  "No",
  "Yes, a current injury",
  "Yes, a past injury that still affects me",
  "I'd rather tell MS Workforce by phone",
] as const

export const TASKS_AFFECTED = [
  "Lifting or carrying",
  "Bending or kneeling",
  "Ladders or heights",
  "Standing for long periods",
  "Using hand or power tools",
  "Working in heat",
  "Other, please explain",
] as const

export const MEDICATION_ANSWERS = ["No", "Yes", "I'd rather tell MS Workforce by phone"] as const

export const MEDICAL_SHARING = [
  "Yes, share it with the site supervisor and first aider",
  "Only in an emergency",
  "Other, please explain",
] as const

export const EMERGENCY_RELATIONSHIPS = [
  "Partner or spouse",
  "Parent",
  "Brother or sister",
  "Son or daughter",
  "Other relative",
  "Friend",
  "Housemate",
  "Other, please explain",
] as const

export const VEVO_METHODS = [
  "I'll email my VEVO result from the myVEVO app",
  "Show my passport on a video call",
  "Show my passport in person",
  "Other, please explain",
] as const

export const TIMESHEET_TASKS = [
  "General clean-up and rubbish",
  "Loading and unloading",
  "Carrying materials",
  "Demolition / strip-out",
  "Digging by hand",
  "Helping on concrete pours",
  "Helping a trade",
  "Setting up barriers and site protection",
  "Other, please explain",
] as const

export const SUPERVISOR_ROLES = [
  "Site supervisor",
  "Site manager",
  "Foreman / leading hand",
  "Project manager",
  "Owner / director",
  "Office / admin",
  "Other, please explain",
] as const

export const TIMESHEET_STATUSES = ["Submitted", "Approved", "Queried"] as const

export const WHITE_CARD_STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"] as const

export const VEVO_RESULTS = ["Work rights OK", "Limited hours", "No work rights"] as const

export const VERIFICATION_METHODS = [
  "Sighted original",
  "Photo in portal",
  "Service NSW check",
  "Video call",
] as const

export const OFFER_STATUSES = ["Offered", "Accepted", "Declined", "Expired", "Cancelled"] as const
export type OfferStatus = (typeof OFFER_STATUSES)[number]

export type PhotoSide = "front" | "back"

export type Ticket = {
  status: string
  number?: string
  state?: string
  expiry?: string | null
  issued?: string | null
  cardNumber?: string
  note?: string
  pendingCheck?: boolean
  checkedBy?: string
  checkedAt?: string
  photosDeletedAt?: string
}

export type LicenceCheck = {
  number?: string
  cardNumber?: string
  expiry?: string | null
  issued?: string | null
  checkedBy?: string
  checkedAt?: string
  photosDeletedAt?: string
}

export type PassportRecord = {
  ciphertext: string
  country: string
  collectedAt: string
}

export type Worker = {
  id: string
  role: "worker" | "admin"
  notionPageId?: string
  name: string
  mobile: string
  email?: string
  suburb?: string
  status: WorkerStatus
  roles: string[]
  experience?: string
  whatsappOk: boolean
  privacyConsent: boolean
  dob?: string
  address?: string
  emergencyContact?: string
  emergencyPhone?: string
  rtw?: string
  rightToWork?: "Yes" | "No"
  vevoConsent?: boolean
  visaSubclass?: string
  visaConditions?: string
  visaExpiry?: string
  vevoResult?: string
  vevoCheckedOn?: string
  passport?: PassportRecord | null
  tickets: Record<TicketType, Ticket>
  transport?: string
  fitness?: string
  healthConsent?: boolean
  policiesAck?: boolean
  contractReceived?: string
  contractAccepted?: boolean
  termsSignedOn?: string
  onboardingSubmitted?: string
  formStatus?: string
  signaturePng?: string
  inductionPassed?: string
  inductionScore?: number
  inductionVersion?: string
  ticketsVerified?: boolean
  verifiedOn?: string
  verifiedBy?: string
  verificationMethod?: string
  imagesDeletedOn?: string
  notes?: string
  preferredName?: string
  postcode?: string
  emergencyRelationship?: string
  experienceLevel?: string
  workHistory?: string
  availableFrom?: string
  workAreas?: string[]
  workDays?: string[]
  vevoMethod?: string
  constructionRecent?: string
  licenceState?: string
  otherTicketsHeld?: string[]
  licenceChecks?: Record<string, LicenceCheck>
  daConsent?: boolean
  declaration?: boolean
  allergies?: string
  allergyTypes?: string[]
  anaphylaxis?: string
  epipen?: string
  medicalNotes?: string
  medicalConditions?: string[]
  injury?: string
  tasksAffected?: string[]
  safetyMedication?: string
  medicalSharing?: string
  idSighted?: boolean
  idSightedMethod?: string
  idSightedOn?: string
  inactiveOn?: string
  createdAt: string
  updatedAt: string
}

export type Offer = {
  id: string
  placementRef: string
  workerId: string
  suburb: string
  address?: string
  siteName?: string
  siteContact?: string
  sitePhone?: string
  siteEmail?: string
  shiftDate: string
  startTime: string
  expectedHours: number
  roleName: string
  rateToWorker: string
  requiredTickets: TicketType[]
  inductionMethod?: string
  inductionLink?: string
  signInMethod?: string
  highRisk?: string
  parking?: string
  bring?: string
  timesheetSigner?: string
  signerRole?: string
  usualFinish?: string
  usualBreak?: number
  remindersOff?: boolean
  status: OfferStatus
  expiresAt: string
  sentAt?: string
  respondedAt?: string
  declineReason?: string
  createdBy: string
}

export type TimesheetStatus = "Draft" | "Submitted" | "Approved" | "Queried"

export type Timesheet = {
  id: string
  workerId: string
  offerId: string
  placementRef: string
  workDate: string
  start: string
  finish: string
  breakMinutes: number
  breakStart?: string
  breakNote?: string
  totalHours: number
  tasks: string
  taskNote?: string
  incident: boolean
  incidentNote?: string
  workerNote?: string
  workerConfirmedAt?: string
  status: TimesheetStatus
  supervisorName?: string
  supervisorEmail?: string
  supervisorRole?: string
  plannedSigner?: string
  signerMismatch?: boolean
  signaturePng?: string
  signatureIp?: string
  signatureUserAgent?: string
  approvedAt?: string
  payFortnight?: string
  payDay?: string
  afterCutoff?: boolean
  corrected?: boolean
  source: "Portal"
  workerName: string
  siteName?: string
  suburb?: string
  confirmationSentAt?: string
}

export type HeadshotStatus = "Pending" | "Approved" | "Rejected"

export type PortalDocument = {
  id: string
  workerId: string
  kind: "ticket" | "id" | "headshot"
  ticketType?: TicketType
  licenceKey?: string
  side?: PhotoSide
  contentType: string
  bytes: number
  createdAt: string
  verifiedAt?: string
  deleteBy?: string
  deletedAt?: string
  headshotStatus?: HeadshotStatus
  rejectReason?: string
  rejectedAt?: string
}

export type AuditEvent = {
  id: string
  at: string
  actorId: string
  action: string
  target: string
  detail?: string
}

export type OtpChallenge = {
  id: string
  target: string
  channel: "sms" | "email"
  codeHash: string
  expiresAt: string
  attempts: number
  lockedUntil?: string
  createdAt: string
  ip?: string
  consumedAt?: string
}

export type Session = {
  id: string
  workerId: string
  role: "worker" | "admin"
  createdAt: string
  expiresAt: string
}

export type MagicToken = {
  id: string
  workerId: string
  expiresAt: string
  usedAt?: string
}

export type OutboxItem = {
  id: string
  kind: string
  payload: Record<string, unknown>
  status: "pending" | "sent" | "failed" | "skipped-mock"
  attempts: number
  nextAttemptAt: string
  lastError?: string
  createdAt: string
}

export type NotificationRecord = {
  id: string
  at: string
  channel: "email" | "sms" | "whatsapp"
  to: string
  subject?: string
  body: string
  status: "sent" | "captured" | "stub"
}

export type InductionAttempt = {
  id: string
  workerId: string
  at: string
  score: number
  critical: number
  pass: boolean
  version: string
}

export type InductionRecord = {
  id: string
  workerId: string
  workerName: string
  score: number
  critical: number
  result: "Pass"
  version: string
  typedName: string
  signaturePng: string
  date: string
}

export type ReminderLog = {
  id: string
  workerId: string
  ticket: string
  kind: string
  expiry: string
  sentAt: string
}

export type StoredBlob = {
  id: string
  contentType: string
  base64: string
  url?: string
}

export function blankTicket(status = "No"): Ticket {
  return { status }
}

export function blankTickets(): Record<TicketType, Ticket> {
  return {
    whiteCard: blankTicket(),
    heights: blankTicket(),
    asbestosA: blankTicket(),
    asbestosB: blankTicket(),
    confinedSpace: blankTicket(),
    firstAid: blankTicket(),
    driverLicence: blankTicket(),
    other: blankTicket(),
  }
}
