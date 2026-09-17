import type { MetadataRoute } from "next";

import { APP_NAME, APP_TAGLINE, APP_TITLE, BRAND_COLORS } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_TITLE,
    short_name: APP_NAME,
    description: APP_TAGLINE,
    start_url: "/",
    display: "standalone",
    background_color: BRAND_COLORS.canvas,
    theme_color: BRAND_COLORS.canvas,
    lang: "tr",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
