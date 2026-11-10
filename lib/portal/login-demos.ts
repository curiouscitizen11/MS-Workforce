import { formatAuMobile } from "@/lib/portal/phone"
import type { Store } from "@/lib/portal/store"

export type LoginDemo = {
  name: string
  email: string
  mobile: string
  hint: string
}

/** Demo names are only for the in-memory trial. Live login must not read or send them. */
export async function loginDemos(store: Store, mock: boolean): Promise<LoginDemo[]> {
  if (!mock) return []
  const workers = await store.workers.all()
  const sam = workers.find((worker) => worker.id === "w-sam")
  const admin = workers.find((worker) => worker.role === "admin")
  return [sam, admin]
    .filter((worker): worker is NonNullable<typeof worker> => Boolean(worker))
    .map((worker) => ({
      name: worker.name,
      email: worker.email || "",
      mobile: formatAuMobile(worker.mobile),
      hint: worker.role === "admin" ? "Admin, then authenticator code" : "Worker",
    }))
    .filter((demo) => demo.email)
}
