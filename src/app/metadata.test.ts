import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { metadata as rootMetadata } from "@/app/layout";
import manifest from "@/app/manifest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { metadata as homeMetadata, WEBSITE_JSON_LD } from "@/app/page";
import { metadata as guideMetadata } from "@/app/nasil-oynanir/page";
import { metadata as tipsMetadata } from "@/app/kelime-bulmacasi-ipuclari/page";
import { generateMetadata } from "@/app/play/page";
import { APP_NAME, APP_TAGLINE, APP_TITLE, PLAY_DESCRIPTION, SITE_ORIGIN, TUTORIAL_DESCRIPTION } from "@/lib/config";

describe("Q37 metadata", () => {
  it("üretim alan adını canonical, robots ve sitemap içinde aynı tutar", () => {
    expect(rootMetadata.metadataBase?.toString()).toBe(`${SITE_ORIGIN}/`);
    expect(rootMetadata.openGraph).toMatchObject({ url: SITE_ORIGIN });
    expect(homeMetadata.alternates).toMatchObject({ canonical: SITE_ORIGIN });
    expect(robots().sitemap).toBe(`${SITE_ORIGIN}/sitemap.xml`);
    expect(sitemap().map((entry) => entry.url)).toEqual(expect.arrayContaining([SITE_ORIGIN + "/", SITE_ORIGIN + "/play"]));
  });

  it("site adı yapılandırılmış verisi ve öğretici URL'si Google'a açıktır", () => {
    expect(WEBSITE_JSON_LD).toMatchObject({
      "@type": "WebSite",
      name: "Play Quadro",
      url: `${SITE_ORIGIN}/`,
    });
    expect(sitemap().map((item) => item.url)).toContain(`${SITE_ORIGIN}/nasil-oynanir`);
    expect(guideMetadata.alternates).toMatchObject({ canonical: "/nasil-oynanir" });
    expect(sitemap().map((item) => item.url)).toContain(`${SITE_ORIGIN}/kelime-bulmacasi-ipuclari`);
    expect(tipsMetadata.alternates).toMatchObject({ canonical: "/kelime-bulmacasi-ipuclari" });
  });

  it("ana sayfa marka, açıklama, ikon ve sosyal önizlemeyi açıkça tanımlar", () => {
    expect(rootMetadata).toMatchObject({
      applicationName: APP_NAME,
      description: APP_TAGLINE,
      manifest: "/manifest.webmanifest",
      icons: {
        icon: [expect.objectContaining({ url: "/icon.svg", type: "image/svg+xml" })],
        apple: [
          expect.objectContaining({
            url: "/apple-icon",
            sizes: "180x180",
            type: "image/png",
          }),
        ],
      },
      openGraph: {
        title: APP_TITLE,
        description: APP_TAGLINE,
        images: [
          expect.objectContaining({
            url: "/opengraph-image",
            width: 1200,
            height: 630,
          }),
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: APP_TITLE,
        description: APP_TAGLINE,
        images: ["/twitter-image"],
      },
    });
  });

  it("manifest marka ve kurulum bilgilerini tutarlı üretir", () => {
    const value = manifest();

    expect(value.name).toBe(APP_TITLE);
    expect(value.short_name).toBe(APP_NAME);
    expect(value.description).toBe(APP_TAGLINE);
    expect(value.start_url).toBe("/");
    expect(value.display).toBe("standalone");
    expect(value.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: "/icon.svg", type: "image/svg+xml" }),
      ]),
    );
  });

  it("oyun ve öğretici için ayrı, anlamlı metadata üretir", async () => {
    await expect(
      generateMetadata({ searchParams: Promise.resolve({ day: "2026-09-20" }) }),
    ).resolves.toMatchObject({
      title: "Bugünün bulmacası",
      description: PLAY_DESCRIPTION,
    });

    await expect(
      generateMetadata({ searchParams: Promise.resolve({ mode: "tutorial" }) }),
    ).resolves.toMatchObject({
      title: "Kısa öğretici",
      description: TUTORIAL_DESCRIPTION,
    });
  });

  it("sosyal önizleme günlük bulmaca veya fixture cevaplarını içe aktarmaz", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/branding/SocialPreview.tsx"),
      "utf8",
    );

    expect(source).not.toContain("content/puzzles");
    expect(source).not.toContain("features/game/fixtures");
    expect(source).not.toContain("standardPuzzle");
  });
});
