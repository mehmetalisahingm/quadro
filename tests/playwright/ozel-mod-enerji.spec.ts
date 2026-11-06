import { mkdirSync } from "node:fs";

import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ mode: "default" });

const KANIT_DIZINI = process.env.QUADRO_KANIT_DIZINI;
async function kanit(page: Page, ad: string): Promise<void> {
  if (!KANIT_DIZINI) return;
  mkdirSync(KANIT_DIZINI, { recursive: true });
  await page.screenshot({ path: `${KANIT_DIZINI}/${ad}.png`, fullPage: true });
}

for (const [ad, genislik] of [["mobil", 390], ["masaustu", 1280]] as const) {
  test(`${ad}: enerji sayacı görünür, oyun 10 enerji harcar`, async ({ page }) => {
    await page.setViewportSize({ width: genislik, height: 900 });
    await page.goto("/play?mode=ladder");
    const bolge = page.getByRole("region", { name: "Özel mod enerjisi" });
    await expect(bolge).toContainText("30 / 30 enerji");
    await expect(bolge).toContainText("Enerjin dolu.");
    await kanit(page, `${ad}-oncesi`);

    await page.getByRole("button", { name: "Oyuna başla · 10 enerji" }).click();
    await expect(page.getByRole("button", { name: "Kasaya al" })).toBeVisible({ timeout: 10_000 });
    await expect(bolge).toContainText("20 / 30 enerji");
    await expect(bolge).toContainText(/Sonraki \+1 enerji: [01]:\d\d/);
    const genislikler = await page.evaluate(() => ({ pencere: window.innerWidth, belge: document.documentElement.scrollWidth }));
    expect(genislikler.belge).toBeLessThanOrEqual(genislikler.pencere);
    await kanit(page, `${ad}-oyunda`);

    await page.reload();
    await expect(page.getByRole("button", { name: "Kasaya al" })).toBeVisible({ timeout: 10_000 });
    await expect(bolge).toContainText("20 / 30 enerji");
  });
}
