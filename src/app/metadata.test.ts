import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { metadata as rootMetadata } from "@/app/layout";
import manifest from "@/app/manifest";
import { generateMetadata } from "@/app/play/page";
import { APP_NAME, APP_TAGLINE, APP_TITLE, PLAY_DESCRIPTION, TUTORIAL_DESCRIPTION } from "@/lib/config";

describe("Q37 metadata", () => {
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
      generateMetadata({ searchParams: Promise.resolve({}) }),
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
