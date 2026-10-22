import { readPrivateBlob } from "@/lib/portal/blob"
import { signingSecret } from "@/lib/portal/config"
import { verifyFileToken } from "@/lib/portal/files"
import { headshotViewDecision } from "@/lib/portal/headshot"
import { readSession } from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"
import { ticketPhotoDecision } from "@/lib/portal/ticket-photos"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const url = new URL(request.url)
  const exp = Number(url.searchParams.get("exp"))
  const signature = url.searchParams.get("sig") || ""
  const signatureOk = verifyFileToken(params.id, exp, signature, signingSecret(), Date.now())
  if (!signatureOk) return new NextResponse("This link has expired.", { status: 401 })
  const current = await readSession()
  const store = await getStore()
  const doc = await store.documents.get(params.id)
  if (doc?.kind === "headshot" && !doc.deletedAt) {
    const allowed = headshotViewDecision({
      signatureOk: true,
      role: current?.worker.role || null,
      viewerId: current?.worker.id || null,
      ownerId: doc.workerId,
    })
    if (allowed !== "ok") return new NextResponse("You can't open this photo.", { status: 403 })
  } else {
    const decision = ticketPhotoDecision({ signatureOk: true, role: current?.worker.role || null })
    if (decision === "forbidden") return new NextResponse("Only the MS Workforce admin can open these photos.", { status: 403 })
  }
  const blob = await store.blobs.get(params.id)
  if (!doc || doc.deletedAt || !blob) return new NextResponse("Not found.", { status: 404 })
  const remote = blob.url ? Buffer.from(await readPrivateBlob(blob.url)) : null
  const bytes = remote || Buffer.from(blob.base64, "base64")
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": blob.contentType,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
