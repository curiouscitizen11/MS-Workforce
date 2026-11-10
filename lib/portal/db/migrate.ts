import { neon } from "@neondatabase/serverless"

/** Keep this in step with drizzle/0001_portal_records.sql. */
export const PORTAL_RECORDS_SQL = `CREATE TABLE IF NOT EXISTS portal_records (
  collection text NOT NULL,
  id text NOT NULL,
  data jsonb NOT NULL,
  PRIMARY KEY (collection, id)
)`

const pending = new Map<string, Promise<void>>()

export async function ensurePortalSchema(databaseUrl: string): Promise<void> {
  const existing = pending.get(databaseUrl)
  if (existing) return existing
  const sql = neon(databaseUrl)
  const job = sql.query(PORTAL_RECORDS_SQL).then(() => undefined)
  pending.set(databaseUrl, job)
  try {
    await job
  } catch (error) {
    pending.delete(databaseUrl)
    throw error
  }
}
