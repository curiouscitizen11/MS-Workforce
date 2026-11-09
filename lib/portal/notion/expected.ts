import { BOOK_ROLES, HEARD_OPTIONS } from "@/lib/portal/book-labour"
import {
  ALLERGY_TYPES,
  EXPERIENCE_LEVELS,
  FITNESS_OPTIONS,
  MEDICAL_CONDITIONS,
  OFFER_STATUSES,
  OTHER_TICKETS,
  ROLES,
  RTW_OPTIONS,
  TASKS_AFFECTED,
  TICKET_ANSWERS,
  TICKET_LABELS,
  TRANSPORT_OPTIONS,
  VERIFICATION_METHODS,
  VEVO_METHODS,
  VEVO_RESULTS,
  WEEKDAYS,
  WORK_AREAS,
  WORKER_STATUSES,
} from "@/lib/portal/types"

export type NotionColumnType =
  | "title"
  | "rich_text"
  | "phone_number"
  | "email"
  | "select"
  | "multi_select"
  | "date"
  | "checkbox"
  | "number"
  | "relation"

export type NotionColumn = {
  name: string
  type: NotionColumnType
  options?: readonly string[]
  /** A missing core column fails the readiness check. Other missing columns are listed and skipped on sync. */
  core?: boolean
  /** False when the setup script creates the column but the portal never writes it. */
  written?: boolean
  note?: string
}

function col(name: string, type: NotionColumnType, extra: Partial<NotionColumn> = {}): NotionColumn {
  return { name, type, written: true, ...extra }
}

const TICKET_FIELDS = ["White card", "Work at heights", "Asbestos class A", "Asbestos class B", "Confined space", "Driver licence", "First aid"] as const

export const WORKER_COLUMNS: NotionColumn[] = [
  col("Name", "title", { core: true }),
  col("Mobile", "phone_number", { core: true }),
  col("Email", "email", { core: true }),
  col("Suburb", "rich_text"),
  col("Roles of interest", "multi_select", { options: ROLES }),
  col("Experience summary", "rich_text"),
  col("WhatsApp OK", "checkbox"),
  col("Status", "select", { options: WORKER_STATUSES, core: true }),
  col("Privacy consent", "checkbox"),
  col("Date of birth", "date"),
  col("Address", "rich_text"),
  col("Emergency contact", "rich_text"),
  col("Emergency phone", "phone_number"),
  col("Preferred name", "rich_text"),
  col("Postcode", "rich_text"),
  col("Emergency relationship", "rich_text"),
  col("Experience level", "select", { options: EXPERIENCE_LEVELS }),
  col("Work history", "rich_text"),
  col("Available from", "date"),
  col("Work areas", "multi_select", { options: WORK_AREAS }),
  col("Work days", "multi_select", { options: WEEKDAYS }),
  col("RTW evidence", "select", { options: RTW_OPTIONS }),
  col("Right to work", "select", { options: ["Yes", "No"] }),
  col("VEVO consent", "checkbox"),
  col("Visa subclass", "rich_text"),
  col("Visa expiry", "date"),
  col("VEVO method", "select", { options: VEVO_METHODS }),
  col("VEVO result", "select", { options: VEVO_RESULTS }),
  col("VEVO checked on", "date"),
  ...TICKET_FIELDS.map((name) => col(name, "select", { options: TICKET_ANSWERS })),
  col("Other tickets", "rich_text"),
  ...TICKET_FIELDS.map((name) => col(name + " expiry", "date")),
  ...TICKET_FIELDS.map((name) => col(name + " issued", "date")),
  col("Driver card number", "rich_text"),
  col("Next ticket expiry", "date"),
  col("Other tickets held", "multi_select", { options: OTHER_TICKETS }),
  col("Transport", "select", { options: TRANSPORT_OPTIONS }),
  col("Fitness declaration", "select", { options: FITNESS_OPTIONS }),
  col("Construction work in last 2 years", "rich_text"),
  col("Driver licence state", "rich_text"),
  col("D&A consent", "checkbox"),
  col("Declaration", "checkbox"),
  col("ID sighted", "checkbox"),
  col("ID sighted method", "rich_text"),
  col("ID sighted on", "date"),
  col("Allergies", "rich_text"),
  col("Allergy types", "multi_select", { options: ALLERGY_TYPES }),
  col("Anaphylaxis risk", "rich_text"),
  col("Carries EpiPen", "rich_text"),
  col("Medical conditions", "multi_select", { options: MEDICAL_CONDITIONS }),
  col("Medical notes", "rich_text"),
  col("Injury affecting duties", "rich_text"),
  col("Tasks affected", "multi_select", { options: TASKS_AFFECTED }),
  col("Safety medication", "rich_text"),
  col("Medical sharing", "rich_text"),
  col("Health info consent", "checkbox"),
  col("Policies acknowledged", "checkbox"),
  col("Contract accepted in form", "checkbox"),
  col("Onboarding submitted", "date"),
  col("Terms signed", "date"),
  col("Form status", "select", { options: ["Onboarding complete"] }),
  col("Induction passed", "date"),
  col("Site inductions", "rich_text"),
  col("Induction score", "number"),
  col("Induction version", "rich_text"),
  col("Tickets verified", "checkbox"),
  col("Verified on", "date"),
  col("Verified by", "rich_text"),
  col("Verification method", "select", { options: VERIFICATION_METHODS }),
  col("Images deleted on", "date"),
  col("Notes", "rich_text"),
]

export const PLACEMENT_COLUMNS: NotionColumn[] = [
  col("Placement", "title", { core: true }),
  col("Client", "rich_text", { core: true }),
  col("Site contact", "rich_text", { core: true }),
  col("Site phone", "phone_number", { core: true }),
  col("Site email", "email", { core: true }),
  col("Site address", "rich_text", { core: true }),
  col("Site suburb", "rich_text", { core: true }),
  col("Roles requested", "multi_select", { options: BOOK_ROLES, core: true }),
  col("Labour request details", "rich_text", { core: true }),
  col("Workers needed", "number", { core: true }),
  col("Start", "date", { core: true }),
  col("Open ended", "checkbox", { core: true }),
  col("End", "date", { core: true }),
  col("Shift", "rich_text", { core: true }),
  col("Heard about us", "select", { options: HEARD_OPTIONS, core: true }),
  col("Status", "select", { options: ["Enquiry"], core: true }),
  col("Request source", "select", { options: ["Website form"], core: true }),
]

export const SHIFT_OFFER_COLUMNS: NotionColumn[] = [
  col("Offer", "title", { core: true }),
  col("Placement", "relation", { written: false, note: "Created by the setup script. The portal does not set this relation." }),
  col("Worker", "relation", { written: false, note: "Created by the setup script. The portal does not set this relation." }),
  col("Shift dates", "date", { core: true }),
  col("Start time", "rich_text", { core: true }),
  col("Role", "rich_text", { core: true }),
  col("Rate to worker", "rich_text", { core: true }),
  col("Status", "select", { options: OFFER_STATUSES, core: true }),
  col("Offer expires", "date"),
  col("Sent at", "date"),
  col("Responded at", "date"),
  col("Decline reason", "rich_text"),
  col("Created by", "rich_text"),
  col("Suburb", "rich_text", { core: true }),
  col("Address", "rich_text"),
  col("Site name", "rich_text"),
  col("Site contact", "rich_text"),
  col("Site phone", "phone_number"),
  col("Expected hours", "number"),
  col("Bring", "rich_text"),
  col("Required tickets", "multi_select", { options: Object.values(TICKET_LABELS) }),
]

export const TIMESHEET_COLUMNS: NotionColumn[] = [
  col("Entry", "title", { core: true }),
  col("Status", "select", { options: ["Submitted", "Approved", "Queried"], core: true }),
  col("Source", "select", { options: ["Portal"], core: true }),
  col("Worker name", "rich_text", { core: true }),
  col("Placement ID", "rich_text", { core: true }),
  col("Work date", "date", { core: true }),
  col("Start (form)", "rich_text"),
  col("Finish (form)", "rich_text"),
  col("Break (form)", "rich_text"),
  col("Break start", "rich_text"),
  col("Hours (form)", "rich_text"),
  col("Total hours", "number", { core: true }),
  col("Tasks", "rich_text"),
  col("Incident reported", "checkbox"),
  col("Incident note", "rich_text"),
  col("Query note", "rich_text"),
  col("Worker confirmed", "date"),
  col("Approved by", "rich_text"),
  col("Supervisor name", "rich_text"),
  col("Supervisor email", "email"),
  col("Approver role", "rich_text"),
  col("Approved at", "date"),
  col("Pay fortnight", "rich_text"),
  col("Signer mismatch", "checkbox"),
  col("Corrected by MS Workforce", "checkbox"),
]

export type NotionDatabaseSpec = {
  env: string
  title: string
  required: boolean
  columns: NotionColumn[]
  note?: string
}

export const NOTION_DATABASES: NotionDatabaseSpec[] = [
  { env: "NOTION_WORKERS_DB", title: "Workers", required: true, columns: WORKER_COLUMNS },
  { env: "NOTION_PLACEMENTS_DB", title: "Placements", required: true, columns: PLACEMENT_COLUMNS },
  { env: "NOTION_TIMESHEETS_DB", title: "Timesheets", required: true, columns: TIMESHEET_COLUMNS },
  {
    env: "NOTION_INDUCTION_DB",
    title: "Induction",
    required: false,
    columns: [],
    note: "Not written. A pass is saved on the worker as Induction passed, Induction score and Induction version.",
  },
  { env: "NOTION_SHIFT_OFFERS_DB", title: "Shift offers", required: true, columns: SHIFT_OFFER_COLUMNS },
]

export const PLACEMENT_COLUMN_NAMES = PLACEMENT_COLUMNS.map((column) => column.name)
