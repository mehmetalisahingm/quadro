import { expect, test } from "@playwright/test";

import { tahtaKartlari } from "./yardimcilar";

test.use({ viewport: { width: 320, height: 800 } });

test("320px görünüm yatay taşmaz ve kart seçimi çalışır", async ({ page }) => {
  await page.goto("/play");
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
