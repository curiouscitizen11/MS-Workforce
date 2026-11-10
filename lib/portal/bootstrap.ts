import { adminEmail, adminMobile } from "@/lib/portal/config"
import type { Store } from "@/lib/portal/store"
import { blankTickets } from "@/lib/portal/types"

const ADMIN_ID = "w-admin"

/** Live mode starts from an empty database. Create Marek's login once, from ADMIN_EMAIL. */
export async function ensureAdminAccount(store: Store) {
  const existing = await store.workers.get(ADMIN_ID)
  if (existing?.role === "admin") return existing
  const workers = await store.workers.all()
  if (workers.some((worker) => worker.role === "admin")) return null
  const now = new Date().toISOString()
  const admin = {
    id: ADMIN_ID,
    role: "admin" as const,
    name: "Marek",
    mobile: adminMobile(),
    email: adminEmail(),
    status: "Ready" as const,
    roles: [],
    whatsappOk: false,
    privacyConsent: true,
    tickets: blankTickets(),
    createdAt: now,
    updatedAt: now,
  }
  await store.workers.save(admin)
  return admin
}
