import { neon } from "@neondatabase/serverless"
import { PORTAL_RECORDS_SQL } from "../lib/portal/db/migrate"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("Set DATABASE_URL to the Neon connection string, then run this again.")
  process.exit(1)
}

const sql = neon(url)
await sql.query(PORTAL_RECORDS_SQL)
console.log("portal_records is ready.")
