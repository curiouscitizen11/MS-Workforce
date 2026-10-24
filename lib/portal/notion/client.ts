import { portalMode } from "@/lib/portal/config"
import { createRateGate, retryAfterMs } from "@/lib/portal/rate-limit"

const gate = createRateGate(500)

export async function notionRequest(
  path: string,
  init: RequestInit & { fetchImpl?: typeof fetch } = {},
  attempt = 0,
): Promise<Response> {
  if (portalMode() === "mock") {
    throw new Error("Mock mode must not call Notion")
  }
  const token = process.env.NOTION_TOKEN
  if (!token) throw new Error("NOTION_TOKEN is required")
  const fetchImpl = init.fetchImpl || fetch
  await gate(Date.now(), (ms) => new Promise((resolve) => setTimeout(resolve, ms)))
  const response = await fetchImpl("https://api.notion.com/v1" + path, {
    method: init.method || "GET",
    body: init.body,
    headers: {
      Authorization: "Bearer " + token,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
  })
  if (response.status === 429 && attempt < 4) {
    const wait = retryAfterMs(429, response.headers.get("retry-after")) || 1000
    await new Promise((resolve) => setTimeout(resolve, wait))
    return notionRequest(path, init, attempt + 1)
  }
  return response
}
