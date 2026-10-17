import { NextResponse } from "next/server"
import { portalMode } from "@/lib/portal/config"
import { createNotify } from "@/lib/portal/notify"
import { processOutbox, purgeDocuments, runReminders, wipePassports } from "@/lib/portal/services"
import { getStore } from "@/lib/portal/store"

export async function GET(request: Request, { params }: { params: { job: string } }) {
  if (portalMode() !== "mock") {
    const secret = process.env.CRON_SECRET
    if (!secret || request.headers.get("authorization") !== "Bearer " + secret) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    }
  }
  const store = await getStore()
  const ctx = { store, now: new Date(), mode: portalMode(), notify: createNotify(store, portalMode()) }
  if (params.job === "outbox") return NextResponse.json(await processOutbox(ctx))
  if (params.job === "reminders") return NextResponse.json(await runReminders(ctx))
  if (params.job === "purge") {
    return NextResponse.json({ documents: await purgeDocuments(ctx), passports: await wipePassports(ctx) })
  }
  return NextResponse.json({ error: "Unknown job" }, { status: 404 })
}
