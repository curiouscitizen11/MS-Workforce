import { NextResponse } from "next/server"
import { portalMode } from "@/lib/portal/config"
import { createNotify } from "@/lib/portal/notify"
import { consumeMagicLink } from "@/lib/portal/services"
import { sessionCookieValue, writePendingCookie } from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || ""
  const store = await getStore()
  const mode = portalMode()
  const result = await consumeMagicLink({ store, now: new Date(), mode, notify: createNotify(store, mode) }, token)
  const login = new URL("/portal/login", request.url)
  if (!result.ok) {
    login.searchParams.set("error", "link")
    return NextResponse.redirect(login)
  }
  if (result.needsTotp) {
    writePendingCookie(result.workerId, Date.now())
    return NextResponse.redirect(new URL("/portal/login/admin", request.url))
  }
  const response = NextResponse.redirect(new URL("/portal", request.url))
  response.cookies.set("msw_portal", sessionCookieValue(result.session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(result.session.expiresAt),
  })
  return response
}
