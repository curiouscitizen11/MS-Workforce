import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { buildSeed, SEED_VERSION, type SeedData } from "@/lib/portal/seed"
import type {
  AuditEvent,
  InductionAttempt,
  InductionRecord,
  MagicToken,
  NotificationRecord,
  Offer,
  OtpChallenge,
  OutboxItem,
  PortalDocument,
  ReminderLog,
  Session,
  StoredBlob,
  Timesheet,
  Worker,
} from "@/lib/portal/types"

export type Repo<T extends { id: string }> = {
  all(): Promise<T[]>
  get(id: string): Promise<T | null>
  save(row: T): Promise<void>
  remove(id: string): Promise<void>
}

export type Store = {
  workers: Repo<Worker>
  offers: Repo<Offer>
  timesheets: Repo<Timesheet>
  documents: Repo<PortalDocument>
  sessions: Repo<Session>
  challenges: Repo<OtpChallenge>
  magics: Repo<MagicToken>
  outbox: Repo<OutboxItem>
  notifications: Repo<NotificationRecord>
  audits: Repo<AuditEvent>
  attempts: Repo<InductionAttempt>
  records: Repo<InductionRecord>
  reminders: Repo<ReminderLog>
  blobs: Repo<StoredBlob>
}

const KEYS = [
  "workers",
  "offers",
  "timesheets",
  "documents",
  "sessions",
  "challenges",
  "magics",
  "outbox",
  "notifications",
  "audits",
  "attempts",
  "records",
  "reminders",
  "blobs",
] as const

type MemoryDb = SeedData

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function repoOf<T extends { id: string }>(rows: T[], persist: () => void): Repo<T> {
  return {
    async all() {
      return rows.map((row) => clone(row))
    },
    async get(id) {
      const found = rows.find((row) => row.id === id)
      return found ? clone(found) : null
    },
    async save(row) {
      const next = clone(row)
      const index = rows.findIndex((item) => item.id === row.id)
      if (index >= 0) rows[index] = next
      else rows.push(next)
      persist()
    },
    async remove(id) {
      const index = rows.findIndex((item) => item.id === id)
      if (index >= 0) rows.splice(index, 1)
      persist()
    },
  }
}

function bind(db: MemoryDb, persist: () => void): Store {
  return {
    workers: repoOf(db.workers, persist),
    offers: repoOf(db.offers, persist),
    timesheets: repoOf(db.timesheets, persist),
    documents: repoOf(db.documents, persist),
    sessions: repoOf(db.sessions, persist),
    challenges: repoOf(db.challenges, persist),
    magics: repoOf(db.magics, persist),
    outbox: repoOf(db.outbox, persist),
    notifications: repoOf(db.notifications, persist),
    audits: repoOf(db.audits, persist),
    attempts: repoOf(db.attempts, persist),
    records: repoOf(db.records, persist),
    reminders: repoOf(db.reminders, persist),
    blobs: repoOf(db.blobs, persist),
  }
}

export function createMemoryStore(options?: { seed?: boolean; now?: Date; persistPath?: string | null }): Store {
  const persistPath = options?.persistPath ?? null
  let db: MemoryDb
  if (persistPath && existsSync(persistPath)) {
    try {
      const parsed = JSON.parse(readFileSync(persistPath, "utf8")) as MemoryDb
      db = parsed.version === SEED_VERSION ? parsed : buildSeed(options?.now)
    } catch {
      db = buildSeed(options?.now)
    }
  } else if (options?.seed) {
    db = buildSeed(options.now)
  } else {
    db = buildSeed(options?.now)
    for (const key of KEYS) db[key] = []
  }

  const persist = () => {
    if (!persistPath) return
    mkdirSync(dirname(persistPath), { recursive: true })
    writeFileSync(persistPath, JSON.stringify(db))
  }
  if (persistPath) persist()
  return bind(db, persist)
}

const globalStore = globalThis as unknown as { __mswStore?: Store }

export function resetMemoryStoreForTests() {
  delete globalStore.__mswStore
}

export async function getStore(): Promise<Store> {
  if (!globalStore.__mswStore) {
    const { portalMode } = await import("@/lib/portal/config")
    if (portalMode() === "live") {
      if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required when the portal is live.")
      const { createPostgresStore } = await import("@/lib/portal/db/postgres")
      globalStore.__mswStore = createPostgresStore(process.env.DATABASE_URL)
    } else {
      globalStore.__mswStore = createMemoryStore({
        seed: true,
        persistPath: join(process.cwd(), ".data", "portal-store.json"),
      })
    }
  }
  return globalStore.__mswStore
}
