import type { Store } from "@/lib/portal/store"
import type { Offer, PortalDocument, Timesheet } from "@/lib/portal/types"

/** Offers, timesheets and documents for one worker. The store filters; this does not load anyone else's rows. */
export async function loadWorkerHome(store: Store, workerId: string) {
  const [offers, sheets, documents] = await Promise.all([
    store.offers.forWorker(workerId),
    store.timesheets.forWorker(workerId),
    store.documents.forWorker(workerId),
  ])
  sheets.sort((a, b) => b.workDate.localeCompare(a.workDate))
  return { offers, sheets, documents }
}

export type WorkerHomeData = {
  offers: Offer[]
  sheets: Timesheet[]
  documents: PortalDocument[]
}
