import type { Metadata, Viewport } from "next";

import {
  APP_NAME,
  APP_TAGLINE,
  APP_TITLE,
  BRAND_COLORS,
  SOCIAL_IMAGE_ALT,
} from "@/lib/config";

import "@/styles/tokens.css";
import "@/styles/game.css";
import "@/styles/result.css";
import "./globals.css";

function resolveMetadataBase(): URL {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL);
  }

  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`);
  }

  return new URL("http://localhost:3000");
}

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  applicationName: APP_NAME,
  title: {
    default: APP_TITLE,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_TAGLINE,
  manifest: "/manifest.webmanifest",
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: APP_NAME,
    title: APP_TITLE,
    description: APP_TAGLINE,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: SOCIAL_IMAGE_ALT,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: APP_TITLE,
    description: APP_TAGLINE,
    images: ["/twitter-image"],
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: BRAND_COLORS.canvas,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
