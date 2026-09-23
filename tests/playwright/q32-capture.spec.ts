import { expect, test } from "@playwright/test";

import { tahtaKartlari } from "./yardimcilar";

const screenshotDir = "test-results/q32";

test("Q32 · 320px hedefler, klavye ve reduced-motion", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/play");

  const tiles = tahtaKartlari(page);
  await expect(tiles).toHaveCount(16);

  const metrics = await page.evaluate(() => {
    const tileRects = Array.from(document.querySelectorAll<HTMLElement>(".q-word-tile")).map(
      (tile) => tile.getBoundingClientRect(),
    );
    const sound = document.querySelector<HTMLElement>("button[aria-pressed][class*='toggle']");
    const soundRect = sound?.getBoundingClientRect();
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      minTileWidth: Math.min(...tileRects.map((rect) => rect.width)),
      minTileHeight: Math.min(...tileRects.map((rect) => rect.height)),
      soundWidth: soundRect?.width ?? 0,
      soundHeight: soundRect?.height ?? 0,
    };
  });

  expect(metrics.viewportWidth).toBe(320);
  expect(metrics.documentWidth).toBeLessThanOrEqual(320);
  expect(metrics.minTileWidth).toBeGreaterThanOrEqual(44);
  expect(metrics.minTileHeight).toBeGreaterThanOrEqual(44);
  expect(metrics.soundWidth).toBeGreaterThanOrEqual(44);
  expect(metrics.soundHeight).toBeGreaterThanOrEqual(44);

  const firstTile = tiles.first();
  const accessibleNameBeforeSelection = await firstTile.getAttribute("aria-label");
  await firstTile.focus();
  await page.keyboard.press("Space");
  await expect(firstTile).toHaveAttribute("aria-pressed", "true");
  await expect(firstTile.locator('[aria-hidden="true"]')).toHaveText("✓");
  expect(await firstTile.getAttribute("aria-label")).toBe(accessibleNameBeforeSelection);

  const transitionDuration = await firstTile.evaluate((element) =>
    getComputedStyle(element).transitionDuration,
  );
  expect(transitionDuration).toMatch(/(^|,\s*)0\.001s/);

  await page.screenshot({ path: `${screenshotDir}/mobile-320.png`, fullPage: true });
});

test("Q32 · masaüstü ve öğretici seçili durum kanıtı", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/play");
  const tiles = tahtaKartlari(page);
  await tiles.first().click();
  await expect(tiles.first().locator('[aria-hidden="true"]')).toHaveText("✓");
  await page.screenshot({ path: `${screenshotDir}/desktop-1280.png`, fullPage: true });

  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/play?mode=tutorial");
  const tutorialTile = page.getByLabel(/öğretici tahtası$/).getByRole("button").first();
  await tutorialTile.focus();
  await page.keyboard.press("Space");
  await expect(tutorialTile).toHaveAttribute("aria-pressed", "true");
  await expect(tutorialTile.locator('[aria-hidden="true"]')).toHaveText("✓");
  await page.screenshot({ path: `${screenshotDir}/tutorial-320.png`, fullPage: true });
});
