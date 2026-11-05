import type { Metadata } from "next"
import { HeadshotForm } from "@/components/portal/HeadshotForm"
import { Heading, StatusChip } from "@/components/portal/ui"
import { signingSecret } from "@/lib/portal/config"
import { signedFilePath } from "@/lib/portal/files"
import { HEADSHOT_GUIDANCE, approvedHeadshot, pendingHeadshot, workerInitials } from "@/lib/portal/headshot"
import { requireUser } from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"

export const metadata: Metadata = { title: "My photo" }

export default async function MyPhotoPage() {
  const { worker } = await requireUser()
  if (worker.role === "admin") return <Heading kicker="Photo" title="Workers add their own photo" />
  const docs = await (await getStore()).documents.all()
  const approved = approvedHeadshot(docs, worker.id)
  const pending = pendingHeadshot(docs, worker.id)
  const rejected = docs
    .filter((doc) => doc.workerId === worker.id && doc.kind === "headshot" && doc.headshotStatus === "Rejected" && !doc.deletedAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  const secret = signingSecret()
  const now = Date.now()
  const shown = pending || approved
  return (
    <div className="space-y-4">
      <Heading kicker="My photo" title="Your headshot" text={HEADSHOT_GUIDANCE} />
      {shown ? (
        <figure className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={signedFilePath(shown.id, now, secret)} alt="Your headshot" className="mx-auto h-36 w-36 rounded-full object-cover" />
          <figcaption className="flex justify-center">
            <StatusChip level={shown.headshotStatus === "Approved" ? "ok" : "pending"}>
              {shown.headshotStatus === "Approved" ? "Approved" : "Waiting for a check"}
            </StatusChip>
          </figcaption>
        </figure>
      ) : (
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full bg-white text-2xl font-semibold">{workerInitials(worker.name)}</div>
          <StatusChip level="pending">Photo pending</StatusChip>
        </div>
      )}
      {approved && pending ? <p className="text-sm leading-relaxed">Your new photo is waiting for a check. Your card still uses the approved photo.</p> : null}
      {rejected?.rejectReason ? <p className="text-sm leading-relaxed">The last photo was not approved: {rejected.rejectReason}.</p> : null}
      <HeadshotForm />
    </div>
  )
}
