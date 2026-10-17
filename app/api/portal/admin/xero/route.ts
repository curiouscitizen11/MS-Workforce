import { NextResponse } from "next/server"
import { xeroCsv, payRunFortnight } from "@/lib/portal/pay"
import { readSession } from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"

export async function GET() {
  const current = await readSession()
  if (!current || current.worker.role !== "admin") {
    return NextResponse.json({ error: "Admin login is required." }, { status: 401 })
  }
  const fortnight = payRunFortnight(new Date())
  const sheets = (await (await getStore()).timesheets.all()).filter(
    (sheet) => sheet.status === "Approved" && sheet.payFortnight === fortnight.label,
  )
  const csv = xeroCsv(
    sheets.map((sheet) => ({
      employee: sheet.workerName,
      date: sheet.workDate,
      start: sheet.start,
      finish: sheet.finish,
      breakMinutes: sheet.breakMinutes,
      hours: sheet.totalHours,
    })),
  )
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="ms-workforce-timesheets.csv"',
    },
  })
}
