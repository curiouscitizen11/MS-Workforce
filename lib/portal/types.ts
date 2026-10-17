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

export const HELD_CHOICES = ["Held", "Not held", "Expired"] as const
export const DRIVER_CLASSES = [
  "Not held",
  "Car",
  "Light rigid",
  "Medium rigid",
  "Heavy rigid",
  "Heavy combination",
  "Expired",
] as const

export const WORKER_STATUSES = ["Applicant", "Onboarding", "Ready", "Inactive"] as const
export type WorkerStatus = (typeof WORKER_STATUSES)[number]

export const ROLES = [
  "General labourer",
  "Trade assistant",
  "Site clean",
  "Materials handling",
  "Other",
] as const

export const PPE_OPTIONS = [
  "Steel-cap boots",
  "Hi-vis",
  "Hard hat",
  "Safety glasses",
  "Gloves",
  "Hearing protection",
] as const

export const TRANSPORT_OPTIONS = [
  "Own car",
  "Public transport",
  "Lift / carpool",
  "Motorbike or bicycle",
  "Other",
] as const

export const FITNESS_OPTIONS = ["Yes", "Yes, with some adjustments", "Not sure"] as const

export const RTW_OPTIONS = ["Citizen - passport", "Permanent resident", "Visa - VEVO"] as const

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

export type Ticket = {
  status: string
  number?: string
  state?: string
  expiry?: string | null
  note?: string
  pendingCheck?: boolean
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
  ppe: string[]
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
  ppe?: string
  inductionMethod?: string
  inductionLink?: string
  signInMethod?: string
  highRisk?: string
  parking?: string
  bring?: string
  status: OfferStatus
  expiresAt: string
  sentAt?: string
  respondedAt?: string
  declineReason?: string
  createdBy: string
}

export type Timesheet = {
  id: string
  workerId: string
  offerId: string
  placementRef: string
  workDate: string
  start: string
  finish: string
  breakMinutes: number
  totalHours: number
  status: "Draft" | "Approved"
  supervisorName?: string
  supervisorRole?: string
  signaturePng?: string
  approvedAt?: string
  workerName: string
  confirmationSentAt?: string
}

export type PortalDocument = {
  id: string
  workerId: string
  kind: "ticket" | "id"
  ticketType?: TicketType
  contentType: string
  bytes: number
  createdAt: string
  verifiedAt?: string
  deleteBy?: string
  deletedAt?: string
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

export function blankTicket(status = "Not held"): Ticket {
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
