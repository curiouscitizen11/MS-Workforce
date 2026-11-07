import { neon } from "@neondatabase/serverless"
import { and, eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/neon-http"
import { portalRecords } from "@/lib/portal/db/schema"
import type { Repo, Store } from "@/lib/portal/store"

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

  return {
    workers: repo("workers"),
    offers: repo("offers"),
    timesheets: repo("timesheets"),
    documents: repo("documents"),
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
