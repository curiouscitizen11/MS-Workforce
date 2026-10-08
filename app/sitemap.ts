import type { MetadataRoute } from "next";
import { SITE_URL } from "@/components/site";

const routes = ["", "/services", "/clients", "/candidates", "/about", "/contact"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: SITE_URL + route,
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
