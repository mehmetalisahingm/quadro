import { expect, test, type Page } from "@playwright/test";

import { GAME_CONSTANTS } from "@/features/game/contracts";

import {
  bulmaca,
  grupla,
  kalanHakOlmali,
  kelimeleriSec,
  oyunaGir,
  tahtaKartlari,
  tahtaSirasi,
  yanlisDortluler,
} from "./yardimcilar";

const SAYFA = "/play?day=2026-09-20";
const KAYIT_ANAHTARI = `quadro:save:v1:${bulmaca.date}`;

/** Yanlış bir tahminle kaydı oluşturur; sonraki senaryolar bu kaydı değiştirir. */
async function kayitliOyunAc(page: Page): Promise<void> {
  await page.goto(SAYFA);
  await oyunaGir(page);
  const [ilkDortlu] = yanlisDortluler();
  await kelimeleriSec(page, ilkDortlu);
  await grupla(page);
  await kalanHakOlmali(page, GAME_CONSTANTS.maxMistakes - 1);
}

/**
 * Kaydı sayfa açılırken değiştirir. Yenilemeden önce yazmak yetmez: oyun `pagehide` anında
 * süreyi kaydederken geçerli durumu üstüne yazar.
 */
async function kayitlaYenile(page: Page, deger: string): Promise<void> {
  await page.addInitScript(([anahtar, metin]) => window.localStorage.setItem(anahtar!, metin!), [KAYIT_ANAHTARI, deger]);
  await page.reload();
}

async function kayitOku(page: Page): Promise<string> {
  const deger = await page.evaluate((anahtar) => window.localStorage.getItem(anahtar), KAYIT_ANAHTARI);
  expect(deger).not.toBeNull();
  return deger ?? "";
}

async function tazeTahtaOlmali(page: Page): Promise<void> {
  await oyunaGir(page);
  await expect(tahtaKartlari(page)).toHaveCount(GAME_CONSTANTS.wordCount);
  await kalanHakOlmali(page, GAME_CONSTANTS.maxMistakes);
}

test("yenileme aynı kart sırasını ve kalan hakkı korur", async ({ page }) => {
  await kayitliOyunAc(page);
  const sira = await tahtaSirasi(page);

  await page.reload();
  await expect(tahtaKartlari(page).first()).toBeEnabled({ timeout: 10_000 });

  expect(await tahtaSirasi(page)).toEqual(sira);
  await kalanHakOlmali(page, GAME_CONSTANTS.maxMistakes - 1);
});

test("bozuk kayıt oyunu çökertmez, tahta taze açılır", async ({ page }) => {
  await kayitliOyunAc(page);
  await kayitlaYenile(page, "{yarım kalmış");

  await tazeTahtaOlmali(page);
  expect(JSON.parse(await kayitOku(page)).snapshot.status).toBe("playing");
});

test("eski günün kaydı bugünkü tahtaya uygulanmaz", async ({ page }) => {
  await kayitliOyunAc(page);
  const kayit = JSON.parse(await kayitOku(page));
  kayit.snapshot.dayKey = "2026-09-19";
  await kayitlaYenile(page, JSON.stringify(kayit));

  await tazeTahtaOlmali(page);
});

test("son hakta çok yakın tahmin oyunu bitirir, yinelenen tahmin son hakkı harcamaz", async ({ page }) => {
  await page.goto(SAYFA);
  await oyunaGir(page);
  const dortluler = yanlisDortluler();
  for (const dortlu of dortluler.slice(0, 3)) {
    await kelimeleriSec(page, dortlu);
    await grupla(page);
    await expect(page.getByRole("button", { name: "Temizle", exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "Temizle", exact: true }).click();
  }
  await kalanHakOlmali(page, 1);

  const [ilkDortlu] = dortluler;
  await kelimeleriSec(page, [...ilkDortlu].reverse());
  await grupla(page);
  await kalanHakOlmali(page, 1);
  await page.getByRole("button", { name: "Temizle", exact: true }).click();

  const [a, b, c] = bulmaca.groups[0].words;
  await kelimeleriSec(page, [a.text, b.text, c.text, bulmaca.groups[1].words[0].text]);
  await grupla(page);
  await expect(page.getByRole("region", { name: "Bugünlük bu kadar." })).toBeVisible({ timeout: 10_000 });
});
