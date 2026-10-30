import { NextResponse } from "next/server"

const manifest = {
  name: "MS Workforce",
  short_name: "MS Workforce",
  description: "MS Workforce worker portal.",
  start_url: "/portal",
  scope: "/portal",
  display: "standalone",
  background_color: "#0b1a2e",
  theme_color: "#0b1a2e",
  icons: [
    { src: "/portal/icon", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/portal/apple-icon", sizes: "180x180", type: "image/png" },
  ],
}

export function GET(request: Request) {
  const origin = request.headers.get("origin")
  const headers: Record<string, string> = {
    "Content-Type": "application/manifest+json; charset=utf-8",
  }
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin
    headers["Access-Control-Allow-Credentials"] = "true"
    headers.Vary = "Origin"
  }
  return NextResponse.json(manifest, { headers })
}
