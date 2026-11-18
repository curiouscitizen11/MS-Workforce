import { neon } from "@neondatabase/serverless"
import { and, eq, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/neon-http"
import { portalRecords } from "@/lib/portal/db/schema"
import { normaliseTimesheet } from "@/lib/portal/pay"
import type { Repo, Store, WorkerRepo } from "@/lib/portal/store"
import type { Timesheet } from "@/lib/portal/types"

export function createPostgresStore(databaseUrl: string): Store {
  const db = drizzle(neon(databaseUrl))

  function repo<T extends { id: string }>(collection: string): Repo<T> {
    return {
      async all() {
        const rows = await db.select().from(portalRecords).where(eq(portalRecords.collection, collection))
        return rows.map((row) => row.data as T)
      },
      async get(id) {
        const rows = await db
          .select()
          .from(portalRecords)
          .where(and(eq(portalRecords.collection, collection), eq(portalRecords.id, id)))
        return rows[0] ? (rows[0].data as T) : null
      },
      async save(row) {
        await db
          .insert(portalRecords)
          .values({ collection, id: row.id, data: row })
          .onConflictDoUpdate({
            target: [portalRecords.collection, portalRecords.id],
            set: { data: row },
          })
      },
      async remove(id) {
        await db.delete(portalRecords).where(and(eq(portalRecords.collection, collection), eq(portalRecords.id, id)))
      },
    }
  }

  function scoped<T extends { id: string; workerId: string }>(collection: string): WorkerRepo<T> {
    const source = repo<T>(collection)
    return {
      ...source,
      async forWorker(workerId) {
        const rows = await db
          .select()
          .from(portalRecords)
          .where(and(eq(portalRecords.collection, collection), sql`${portalRecords.data}->>'workerId' = ${workerId}`))
        return rows.map((row) => row.data as T)
      },
    }
  }

  function timesheets(source: WorkerRepo<Timesheet>): WorkerRepo<Timesheet> {
    return {
      async all() {
        return (await source.all()).map((row) => normaliseTimesheet(row))
      },
      async forWorker(workerId) {
        return (await source.forWorker(workerId)).map((row) => normaliseTimesheet(row))
      },
      async get(id) {
        const row = await source.get(id)
        return row ? normaliseTimesheet(row) : null
      },
      async save(row) {
        await source.save(normaliseTimesheet(row))
      },
      remove(id) {
        return source.remove(id)
      },
    }
  }

  return {
    workers: repo("workers"),
    offers: scoped("offers"),
    timesheets: timesheets(scoped<Timesheet>("timesheets")),
    documents: scoped("documents"),
    sessions: repo("sessions"),
    challenges: repo("challenges"),
    magics: repo("magics"),
    outbox: repo("outbox"),
    notifications: repo("notifications"),
    audits: repo("audits"),
    attempts: repo("attempts"),
    records: repo("records"),
    reminders: repo("reminders"),
    blobs: repo("blobs"),
  }
}
