import { formatDate } from "@/lib/portal/dates"

export const WHS_INDUCTION = "MS Workforce WHS induction"

export type SiteInduction = { name: string; doneOn?: string }

export type InductionOffer = { status: string; siteName?: string; suburb?: string; inductionLink?: string }

export type InductionRow = {
  id: string
  name: string
  status: string
  done: boolean
  kind: "whs" | "site"
  href?: string
  link?: string
}

function siteName(offer: InductionOffer) {
  return (offer.siteName || offer.suburb || "").trim()
}

export function inductionRows(input: {
  inductionPassed?: string
  siteInductions?: SiteInduction[]
  offers: InductionOffer[]
}): InductionRow[] {
  const rows: InductionRow[] = [
    {
      id: "whs",
      name: WHS_INDUCTION,
      status: input.inductionPassed ? "Done " + formatDate(input.inductionPassed) : "To do",
      done: Boolean(input.inductionPassed),
      kind: "whs",
      href: "/portal/induction",
    },
  ]
  const seen = new Set<string>()
  const stored = new Map((input.siteInductions || []).map((item) => [item.name.toLowerCase(), item]))
  function add(name: string, link?: string) {
    const key = name.toLowerCase()
    if (!name || seen.has(key) || key === WHS_INDUCTION.toLowerCase()) return
    seen.add(key)
    const saved = stored.get(key)
    rows.push({
      id: "site:" + key,
      name: saved?.name || name,
      status: saved?.doneOn ? "Done " + formatDate(saved.doneOn) : "To do",
      done: Boolean(saved?.doneOn),
      kind: "site",
      link,
    })
  }
  for (const offer of input.offers) {
    if (offer.status !== "Accepted") continue
    add(siteName(offer), offer.inductionLink)
  }
  for (const item of input.siteInductions || []) add(item.name)
  return rows
}

export function inductionPickerSites(offers: InductionOffer[], rows: InductionRow[]) {
  const added = new Set(rows.map((row) => row.name.toLowerCase()))
  const sites: { id: string; label: string }[] = []
  const seen = new Set<string>()
  for (const offer of offers) {
    const name = siteName(offer)
    const key = name.toLowerCase()
    if (!name || seen.has(key) || added.has(key)) continue
    seen.add(key)
    sites.push({ id: name, label: name })
  }
  return sites
}
