import type { MetadataRoute } from "next";
import { SITE_URL } from "@/components/site";

// lastModified = the date the page's visible content last changed (from the git history of
// each page's source file; metadata-only edits are not counted). Update the date here
// whenever a page's content is edited. The dates are fixed on purpose: using today's date
// for every page would tell search engines everything changed on every deploy.
const pages: { route: string; lastModified: string }[] = [
  { route: "", lastModified: "2026-10-25" },
  { route: "/services", lastModified: "2026-10-25" },
  { route: "/labourers-sydney", lastModified: "2026-10-25" },
  { route: "/clients", lastModified: "2026-10-25" },
  { route: "/candidates", lastModified: "2026-10-25" },
  { route: "/about", lastModified: "2026-10-23" },
  { route: "/contact", lastModified: "2026-10-23" },
  { route: "/privacy", lastModified: "2026-10-23" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map(({ route, lastModified }) => ({
    url: SITE_URL + route,
    lastModified,
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
