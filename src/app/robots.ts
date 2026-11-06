import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/config";

/** Allow public pages to be discovered without asking crawlers to index private/API routes. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/auth/", "/passport/", "/stats/"],
    }],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
