import type { Metadata } from "next"
import { Heading, StatusChip } from "@/components/portal/ui"
import { buildReadinessReport, type ReadinessItem } from "@/lib/portal/readiness"
import { requireAdmin } from "@/lib/portal/session"

export const metadata: Metadata = { title: "Readiness" }
export const dynamic = "force-dynamic"

function CheckList({ title, items }: { title: string; items: ReadinessItem[] }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">{title}</h2>
      <ul className="space-y-2">
        {items.map((entry) => (
          <li key={entry.name} className="portal-panel space-y-2">
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              <span>{entry.name}</span>
              <StatusChip level={entry.ok ? "ok" : "restricted"}>{entry.ok ? "In place" : "Fix this"}</StatusChip>
              {entry.required ? null : <span className="font-normal text-navy/70">Optional</span>}
            </p>
            <p className="text-sm">{entry.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default async function ReadyPage() {
  await requireAdmin()
  const report = await buildReadinessReport()
  return (
    <div className="space-y-4">
      <Heading
        kicker="Admin"
        title={report.ready ? "Ready to go live" : "Not ready yet"}
        text="This list shows what is set and what is missing. It does not show the values."
      />
      <CheckList title="Settings" items={report.config} />
      <CheckList title="Connections" items={report.connections} />
      <p className="text-sm text-navy/70">The same check is at /api/portal/ready. Send Authorization: Bearer and the CRON_SECRET, or open this page while logged in as admin.</p>
    </div>
  )
}
