import { NextResponse } from "next/server"
import { portalMode } from "@/lib/portal/config"
import { createNotify } from "@/lib/portal/notify"
import { consumeMagicLink } from "@/lib/portal/services"
import { getStore } from "@/lib/portal/store"
import { createHmac } from "crypto"
import { sessionSecret } from "@/lib/portal/config"

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
    const exp = Math.floor(Date.now() / 1000) + 300
    const payload = result.workerId + "." + exp
    const signature = createHmac("sha256", sessionSecret()).update(payload).digest("base64url")
    const response = NextResponse.redirect(new URL("/portal/login/admin", request.url))
    response.cookies.set("msw_admin_pending", payload + "." + signature, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 300 })
    return response
  }
  const signature = createHmac("sha256", sessionSecret()).update(result.session.id).digest("base64url")
  const response = NextResponse.redirect(new URL("/portal", request.url))
  response.cookies.set("msw_portal", result.session.id + "." + signature, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(result.session.expiresAt),
  })
  return response
}
