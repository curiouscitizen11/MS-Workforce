import { portalIsLive } from "@/lib/portal/access"
import { REQUEST_LABOUR_HREF, WORK_ENQUIRY_HREF } from "@/components/site"

/** Apply for work. The portal join page only after the portal is live. */
export function applyForWorkHref(): string {
  return portalIsLive() ? "/portal/join" : WORK_ENQUIRY_HREF
}

/** Book labour. The portal form only after the portal is live. */
export function bookLabourHref(): string {
  return portalIsLive() ? "/portal/book-labour" : REQUEST_LABOUR_HREF
}
