import type { Metadata } from "next"
import { HeadshotReview } from "@/components/portal/HeadshotReview"
import { Heading } from "@/components/portal/ui"
import { signingSecret } from "@/lib/portal/config"
import { signedFilePath } from "@/lib/portal/files"
import { requireAdmin } from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"

export const metadata: Metadata = { title: "Photos to approve" }

export default async function PhotosPage() {
  await requireAdmin()
  const store = await getStore()
  const secret = signingSecret()
  const now = Date.now()
  const workers = await store.workers.all()
  const pending = (await store.documents.all())
    .filter((doc) => doc.kind === "headshot" && doc.headshotStatus === "Pending" && !doc.deletedAt)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  return (
    <div className="space-y-4">
      <Heading kicker="Photos" title="Photos to approve" text="Check that the photo is a clear picture of the worker, with no sunglasses, hat or hard hat." />
      {pending.length ? (
        pending.map((doc) => {
          const worker = workers.find((item) => item.id === doc.workerId)
          return <HeadshotReview key={doc.id} id={doc.id} name={worker?.name || "Worker"} url={signedFilePath(doc.id, now, secret)} />
        })
      ) : (
        <p className="rounded-2xl bg-white p-4 text-sm">No photos are waiting.</p>
      )}
    </div>
  )
}
