import {
  SHIFT_OFFERS_SCHEMA,
  assertCanCreateShiftOffersDatabase,
} from "../lib/portal/notion/shift-offers.mjs"

const apply = process.argv.includes("--apply")

function notionProperty(property) {
  if (property.type === "title") return { title: {} }
  if (property.type === "rich_text") return { rich_text: {} }
  if (property.type === "number") return { number: { format: "number" } }
  if (property.type === "phone_number") return { phone_number: {} }
  if (property.type === "date") return { date: {} }
  if (property.type === "select") {
    return { select: { options: property.options.map((name) => ({ name })) } }
  }
  if (property.type === "multi_select") {
    return { multi_select: { options: property.options.map((name) => ({ name })) } }
  }
  if (property.type === "relation") {
    const databaseId =
      property.relatesTo === "Workers" ? process.env.NOTION_WORKERS_DB : process.env.NOTION_PLACEMENTS_DB
    if (!databaseId) {
      throw new Error("Set NOTION_WORKERS_DB and NOTION_PLACEMENTS_DB to the TEST database ids before creating Shift offers.")
    }
    return { relation: { database_id: databaseId, type: "single_property", single_property: {} } }
  }
  throw new Error("Unknown property type " + property.type)
}

if (!apply) {
  console.log("MS Workforce — Shift offers database")
  console.log("")
  console.log("This script only prints the plan. It does not change Notion.")
  console.log("Create the database in a TEST copy of your workspace first.")
  console.log("Do not point it at the live Workers or Placements databases.")
  console.log("")
  console.log("When the TEST workspace is ready, run:")
  console.log("  PORTAL_NOTION_ENV=test CONFIRM_CREATE_SHIFT_OFFERS=yes \\")
  console.log("  NOTION_TOKEN=... NOTION_PARENT_PAGE_ID=... \\")
  console.log("  NOTION_WORKERS_DB=... NOTION_PLACEMENTS_DB=... \\")
  console.log("  npm run portal:shift-offers -- --apply")
  console.log("")
  console.log(JSON.stringify(SHIFT_OFFERS_SCHEMA, null, 2))
  process.exit(0)
}

const ids = [
  process.env.NOTION_PARENT_PAGE_ID,
  process.env.NOTION_WORKERS_DB,
  process.env.NOTION_PLACEMENTS_DB,
  process.env.NOTION_SHIFT_OFFERS_DB,
]
assertCanCreateShiftOffersDatabase({
  notionEnv: process.env.PORTAL_NOTION_ENV,
  confirm: process.env.CONFIRM_CREATE_SHIFT_OFFERS,
  ids,
})

if (!process.env.NOTION_TOKEN || !process.env.NOTION_PARENT_PAGE_ID) {
  throw new Error("NOTION_TOKEN and NOTION_PARENT_PAGE_ID are required to create the TEST database.")
}

const properties = {}
for (const property of SHIFT_OFFERS_SCHEMA.properties) properties[property.name] = notionProperty(property)

const response = await fetch("https://api.notion.com/v1/databases", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + process.env.NOTION_TOKEN,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    parent: { type: "page_id", page_id: process.env.NOTION_PARENT_PAGE_ID },
    title: [{ type: "text", text: { content: "Shift offers" } }],
    properties,
  }),
})

if (!response.ok) {
  const text = await response.text()
  throw new Error("Notion did not create the database (" + response.status + "). " + text.slice(0, 400))
}

const body = await response.json()
console.log("Created the TEST Shift offers database.")
console.log("Add this id to NOTION_SHIFT_OFFERS_DB:")
console.log(body.id)
