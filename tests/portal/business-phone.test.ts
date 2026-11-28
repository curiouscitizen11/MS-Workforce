import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"
import ContactButtons from "@/components/ContactButtons"
import { ContactLine, RunningLate } from "@/components/portal/ContactLine"
import { businessPhone, contactSentence } from "@/lib/portal/business-phone"
import { canAcceptShift } from "@/lib/portal/compliance"
import { TICKET_TYPES, type TicketType } from "@/lib/portal/types"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined, refresh: () => undefined }),
}))

afterEach(() => {
  delete process.env.BUSINESS_PHONE
})

function screen() {
  return [
    renderToStaticMarkup(createElement(ContactLine, { lead: "Something wrong?" })),
    renderToStaticMarkup(createElement(RunningLate)),
    renderToStaticMarkup(createElement(ContactButtons)),
  ].join("\n")
}

function blockedMessage() {
  const tickets = TICKET_TYPES.map((type) => ({ type, status: type === "whiteCard" ? "Expired" : "No" }))
  const result = canAcceptShift({ tickets, jobDate: "2026-10-17", required: ["whiteCard"] as TicketType[] })
  if (result.ok) throw new Error("expected a block")
  return result.message
}

describe("business phone", () => {
  it("shows the jobs email and no call number when BUSINESS_PHONE is unset", async () => {
    delete process.env.BUSINESS_PHONE
    expect(businessPhone()).toBe("")
    expect(contactSentence()).toBe("Contact MS Workforce at jobs@msworkforce.au")
    const { OfferActions } = await import("@/components/portal/OfferActions")
    const html = screen() + renderToStaticMarkup(createElement(OfferActions, { offerId: "offer-1", blocked: blockedMessage() }))
    expect(html).not.toContain("0435")
    expect(html).not.toContain("tel:")
    expect(html).not.toContain("BUSINESS_PHONE")
    expect(html).toContain("mailto:jobs@msworkforce.au")
    expect(html).toContain("Contact MS Workforce at jobs@msworkforce.au")
    expect(html).toContain('href="mailto:jobs@msworkforce.au"')
    expect(blockedMessage()).toContain("DO NOT BOOK")
    expect(blockedMessage()).not.toContain("0435")
  })

  it("shows a call link for a real number and hides a placeholder", () => {
    process.env.BUSINESS_PHONE = "02 9999 0000"
    const html = screen()
    expect(html).toContain("tel:0299990000")
    expect(html).toContain("02 9999 0000")
    expect(html).toContain("Running late")
    expect(html).not.toContain("0435")
    process.env.BUSINESS_PHONE = "not-a-number"
    const hidden = screen()
    expect(hidden).not.toContain("not-a-number")
    expect(hidden).not.toContain("tel:")
    expect(hidden).toContain("mailto:jobs@msworkforce.au")
  })
})
