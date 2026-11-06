import { expect, test } from "@playwright/test";

import { oyunaGir, tahtaKartlari } from "./yardimcilar";

test.use({ viewport: { width: 320, height: 800 } });

test("320px görünüm yatay taşmaz ve kart seçimi çalışır", async ({ page }) => {
  await page.goto("/play");
  await oyunaGir(page);
  await expect(page.getByRole("heading", { name: "Gizli bağları bul" })).toBeVisible();
  await expect(tahtaKartlari(page)).toHaveCount(16);

  const metrics = await page.evaluate(() => {
    const board = document.querySelector(".q-game-board");
    const rect = board?.getBoundingClientRect();
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      boardLeft: rect?.left ?? -1,
      boardRight: rect?.right ?? Number.POSITIVE_INFINITY,
    };
  });

  expect(metrics.viewportWidth).toBe(320);
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth);
  expect(metrics.boardLeft).toBeGreaterThanOrEqual(0);
  expect(metrics.boardRight).toBeLessThanOrEqual(metrics.viewportWidth + 0.5);

  const firstTile = tahtaKartlari(page).first();
  await firstTile.click();
  await expect(firstTile).toHaveAttribute("aria-pressed", "true");
});

for (const width of [320, 390]) {
  test(`${width}px mobil mod etiketi hesap düğmesinin altına girmez`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    for (const mode of ["risk", "ladder", "bomb"]) {
      await page.goto(`/play?mode=${mode}`);
      const account = page.getByLabel("Hesap");
      const kicker = page.locator(".q-play-header .q-play-kicker");
      await expect(account).toBeVisible();
      await expect(kicker).toBeVisible();
      const positions = await page.evaluate(() => {
        const accountRect = document.querySelector('[aria-label="Hesap"]')?.getBoundingClientRect();
        const kickerRect = document.querySelector(".q-play-header .q-play-kicker")?.getBoundingClientRect();
        return {
          accountBottom: accountRect?.bottom ?? Number.POSITIVE_INFINITY,
          kickerTop: kickerRect?.top ?? 0,
          kickerRight: kickerRect?.right ?? Number.POSITIVE_INFINITY,
          scrollWidth: document.documentElement.scrollWidth,
        };
      });
      expect(positions.kickerTop).toBeGreaterThanOrEqual(positions.accountBottom + 2);
      expect(positions.kickerRight).toBeLessThanOrEqual(width + 0.5);
      expect(positions.scrollWidth).toBeLessThanOrEqual(width + 0.5);
    }
  });
}
