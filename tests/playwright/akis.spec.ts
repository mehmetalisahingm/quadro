import { expect, test } from "@playwright/test";

import { GAME_CONSTANTS } from "@/features/game/contracts";

import {
  beklenenBaslangicSirasi,
  bulmaca,
  grupKelimeleri,
  grupla,
  kalanHakOlmali,
  kelimeleriSec,
  oyunuKazan,
  paylasimOnizlemesi,
  sonucIstatistigi,
  tahtaKartlari,
} from "./yardimcilar";

test("ana sayfadaki bağlantı oyuncuyu bulmacaya götürür", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "16 kelime. 4 gizli bağ." })).toBeVisible();
  await page.getByRole("link", { name: "Bugünün bulmacasını çöz" }).click();
  await expect(page).toHaveURL(/\/play$/);
  await expect(page.getByRole("heading", { name: "Gizli bağları bul" })).toBeVisible();
  await expect(tahtaKartlari(page)).toHaveCount(GAME_CONSTANTS.wordCount);
  await kalanHakOlmali(page, GAME_CONSTANTS.maxMistakes);
});

test("tahta sabit tohumla açılır ve yeniden yüklemede aynı kalır", async ({ page }) => {
  const beklenen = beklenenBaslangicSirasi();
  await page.goto("/play");
  await expect(tahtaKartlari(page)).toHaveText(beklenen);
  await page.reload();
  await expect(tahtaKartlari(page)).toHaveText(beklenen);
});

test("her doğru grup tahtadan çözülenler satırına geçer", async ({ page }) => {
  await page.goto("/play");
  let kalanKart = GAME_CONSTANTS.wordCount;

  for (const grup of bulmaca.groups) {
    await expect(tahtaKartlari(page)).toHaveCount(kalanKart);
    await kelimeleriSec(page, grupKelimeleri(grup));
    await grupla(page);
    kalanKart -= GAME_CONSTANTS.groupSize;

    if (kalanKart > 0) {
      await expect(page.getByLabel(`Çözülen grup: ${grup.title}`)).toBeVisible();
      await expect(tahtaKartlari(page)).toHaveCount(kalanKart);
      await kalanHakOlmali(page, GAME_CONSTANTS.maxMistakes);
    }
  }

  await expect(page.getByRole("heading", { name: "Dört bağı da buldun." })).toBeVisible();
  await expect(tahtaKartlari(page)).toHaveCount(0);
});

test("dört grubu bulan oyuncu kazanır ve spoilersız sonucunu paylaşabilir", async ({ page }) => {
  await page.goto("/play");
  await oyunuKazan(page);

  await expect(page.getByRole("heading", { name: "Dört bağı da buldun." })).toBeVisible();
  await expect(sonucIstatistigi(page, "Bulunan")).toHaveText(`4/${GAME_CONSTANTS.groupCount}`);
  await expect(sonucIstatistigi(page, "Hata")).toHaveText("0");
  await expect(page.getByText("Bulundu", { exact: true })).toHaveCount(GAME_CONSTANTS.groupCount);
  await expect(page.getByText("Cevap", { exact: true })).toHaveCount(0);
  await expect(paylasimOnizlemesi(page)).toContainText(`Quadro ${bulmaca.date} 4/4`);
});

test("kazanılan oyunda tahta ve kontroller kaybolur", async ({ page }) => {
  await page.goto("/play");
  await oyunuKazan(page);

  await expect(page.getByRole("heading", { name: "Dört bağı da buldun." })).toBeVisible();
  await expect(tahtaKartlari(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Grupla|Kontrol ediliyor/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Karıştır", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Temizle", exact: true })).toHaveCount(0);
});
