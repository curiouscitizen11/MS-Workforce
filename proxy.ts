import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { portalReachable } from "@/lib/portal/access"
import { portalHomeLoginRedirect } from "@/lib/portal/session"

export function proxy(request: NextRequest) {
  if (portalReachable()) {
    const login = portalHomeLoginRedirect(request.nextUrl.pathname, request.cookies.get("msw_portal")?.value)
    if (login) {
      const url = request.nextUrl.clone()
      url.pathname = login
      url.search = ""
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  // Daily jobs and the readiness check stay open. With no live config they do not call Notion or email.
  if (pathname.startsWith("/api/portal/cron")) return NextResponse.next()
  if (pathname === "/api/portal/ready") return NextResponse.next()

  if (pathname.startsWith("/api/portal")) {
    return NextResponse.json({ error: "Portal opening soon" }, { status: 503 })
  }

  const url = request.nextUrl.clone()
  url.pathname = "/portal-opening-soon"
  url.search = ""
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ["/portal", "/portal/:path*", "/join", "/api/portal/:path*"],
}
