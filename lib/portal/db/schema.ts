import { jsonb, pgTable, primaryKey, text } from "drizzle-orm/pg-core"

/** Cache, sessions, outbox and audit rows. Notion stays the source of truth. */
export const portalRecords = pgTable(
  "portal_records",
  {
    collection: text("collection").notNull(),
    id: text("id").notNull(),
    data: jsonb("data").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.collection, table.id] }),
  }),
)
