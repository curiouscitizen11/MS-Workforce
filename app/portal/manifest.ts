import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
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
}
