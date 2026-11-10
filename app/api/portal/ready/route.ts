import { NextResponse } from "next/server"
import { buildReadinessReport, cronAuthorised } from "@/lib/portal/readiness"
import { readSession } from "@/lib/portal/session"

export async function GET(request: Request) {
  const session = await readSession()
  if (session?.worker.role !== "admin" && !cronAuthorised(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }
  return NextResponse.json(await buildReadinessReport())
}
