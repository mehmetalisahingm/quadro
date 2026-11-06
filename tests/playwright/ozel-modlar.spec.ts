import { mkdirSync, readFileSync } from "node:fs";

import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ mode: "default" });

const KANIT_DIZINI = process.env.QUADRO_KANIT_DIZINI;
async function kanit(page: Page, ad: string): Promise<void> {
  if (!KANIT_DIZINI) return;
  mkdirSync(KANIT_DIZINI, { recursive: true });
  await page.screenshot({ path: `${KANIT_DIZINI}/${ad}.png`, fullPage: true });
}

/** İlk özel oyun slot 0'dır: Orta parkurun 1. bölümü. */
const tahta = JSON.parse(readFileSync("src/content/modes/medium-1.json", "utf8")) as { groups: { difficulty: number; words: { text: string }[] }[] };

async function basla(page: Page, mod: string) {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`/play?mode=${mod}`);
  await page.getByRole("button", { name: "Oyuna başla · 10 enerji" }).click();
}

async function grupla(page: Page, kelimeler: readonly { text: string }[]) {
  for (const kelime of kelimeler) await page.getByRole("button", { name: new RegExp(`^${kelime.text}(, bombalı kart)?$`) }).click();
  await page.getByRole("button", { name: "Grupla", exact: true }).click();
}

async function tasmaYok(page: Page) {
  const olcu = await page.evaluate(() => ({ pencere: window.innerWidth, belge: document.documentElement.scrollWidth }));
  expect(olcu.belge).toBeLessThanOrEqual(olcu.pencere);
}

test("Risk: kural anlatımı, klavyeyle duruş seçimi ve Cesur kazanç", async ({ page }) => {
  await basla(page, "risk");
  await expect(page.getByText("Risk nasıl oynanır?")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/Güvenli \+25/)).toBeVisible();
  const guvenli = page.getByRole("radio", { name: /Güvenli/ });
  await guvenli.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: /Cesur/ })).toBeChecked();
  await expect(page.getByRole("radio", { name: /Efsane/ })).toBeDisabled();
  await grupla(page, tahta.groups[0]!.words);
  await expect(page.getByText("POT", { exact: true }).locator("..")).toContainText("175");
  await expect(page.getByRole("radio", { name: /Efsane/ })).toBeEnabled();
  await tasmaYok(page);
  await kanit(page, "risk");
});

test("Çarpan Merdiveni: basamak yükselir, kalkan kurulur", async ({ page }) => {
  await basla(page, "ladder");
  await expect(page.getByText("Çarpan Merdiveni nasıl oynanır?")).toBeVisible({ timeout: 10_000 });
  await grupla(page, tahta.groups[0]!.words);
  await expect(page.getByRole("list", { name: "Çarpan 2×" })).toBeVisible();
  await expect(page.getByText(/Sıradaki doğru grup: \+200/)).toBeVisible();
  await page.getByRole("button", { name: "Kalkanı kur" }).click();
  await expect(page.getByRole("button", { name: "Kalkan kurulu" })).toBeDisabled();
  await tasmaYok(page);
  await kanit(page, "merdiven");
});

test("Bomba Kart: bomba görünür, fitil ve soğutma çalışır", async ({ page }) => {
  await basla(page, "bomb");
  await expect(page.getByText("Bomba Kart nasıl oynanır?")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("button", { name: /bombalı kart/ })).toBeVisible();
  await expect(page.getByText(/Fitil:/)).toContainText("3");
  await page.getByRole("button", { name: "Soğut · +2 tur" }).click();
  await expect(page.getByText(/Fitil:/)).toContainText("5");
  await tasmaYok(page);
  await kanit(page, "bomba");

  await page.reload();
  await expect(page.getByText(/Fitil:/)).toContainText("5", { timeout: 10_000 });
  await expect(page.getByRole("button", { name: "Soğutma kullanıldı" })).toBeDisabled();
});
