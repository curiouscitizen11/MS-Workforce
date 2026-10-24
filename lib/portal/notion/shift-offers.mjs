/** Shift offers database. The setup script prints this. It does not create it unless you opt in on a TEST workspace. */

export const PRODUCTION_NOTION_IDS = [
  "6da57660-0ef5-4faf-a63e-c85a42b68cf2",
  "7e196128-d21e-455f-965b-d8daf57f4765",
  "2d94dec5-76dc-49e7-9c99-6fa988e6403e",
  "79b62520-b7c8-49eb-b6cd-1cb8459b56bf",
  "bd84b5f5-4c2f-44c0-9136-70d63ab5032a",
  "69740d4cbc6c41ef914d8fb316b4b957",
]

export function normaliseNotionId(value) {
  return String(value || "").replace(/-/g, "").toLowerCase()
}

const BLOCKED = new Set(PRODUCTION_NOTION_IDS.map(normaliseNotionId))

export function assertCanCreateShiftOffersDatabase({ notionEnv, confirm, ids }) {
  if (notionEnv !== "test") {
    throw new Error("Refusing to create Shift offers. Set PORTAL_NOTION_ENV=test. This script does not change the live Notion workspace.")
  }
  if (confirm !== "yes") {
    throw new Error("Refusing to create Shift offers. Set CONFIRM_CREATE_SHIFT_OFFERS=yes after you have checked the page is the TEST workspace.")
  }
  for (const id of ids || []) {
    if (BLOCKED.has(normaliseNotionId(id))) {
      throw new Error("Refusing to create Shift offers. That id belongs to the live MS Workforce workspace.")
    }
  }
}

export const SHIFT_OFFERS_SCHEMA = {
  title: "Shift offers",
  notes: [
    "Create this in the TEST copy of MS Workforce HQ first.",
    "Do not create it in the live workspace until Mav says so.",
    "The first properties match the portal plan. The extra text fields let the portal show the offer without a second database.",
  ],
  properties: [
    { name: "Offer", type: "title" },
    { name: "Placement", type: "relation", relatesTo: "Placements" },
    { name: "Worker", type: "relation", relatesTo: "Workers" },
    { name: "Shift dates", type: "date" },
    { name: "Start time", type: "rich_text" },
    { name: "Role", type: "rich_text" },
    { name: "Rate to worker", type: "rich_text" },
    {
      name: "Status",
      type: "select",
      options: ["Offered", "Accepted", "Declined", "Expired", "Cancelled"],
    },
    { name: "Offer expires", type: "date" },
    { name: "Sent at", type: "date" },
    { name: "Responded at", type: "date" },
    { name: "Decline reason", type: "rich_text" },
    { name: "Created by", type: "rich_text" },
    { name: "Suburb", type: "rich_text" },
    { name: "Address", type: "rich_text" },
    { name: "Site name", type: "rich_text" },
    { name: "Site contact", type: "rich_text" },
    { name: "Site phone", type: "phone_number" },
    { name: "Expected hours", type: "number" },
    { name: "Bring", type: "rich_text" },
    {
      name: "Required tickets",
      type: "multi_select",
      options: [
        "White card",
        "Work at heights",
        "Asbestos Class A",
        "Asbestos Class B",
        "Confined space",
        "First aid",
        "Driver licence",
      ],
    },
  ],
}
