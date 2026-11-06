import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/config";

const publicRoutes = ["/", "/play", "/challenges", "/journey", "/pictures"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((pathname, index) => ({
    url: new URL(pathname, SITE_ORIGIN).toString(),
    changeFrequency: index === 0 ? "daily" : "weekly",
    priority: index === 0 ? 1 : 0.7,
  }));
}
