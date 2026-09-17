import { expect, test } from "@playwright/test";

import { GAME_CONSTANTS } from "@/features/game/contracts";

import {
  birUzaktaDortlu,
  bulmaca,
  geriBildirim,
  gonderDugmesi,
  grupKelimeleri,
  grupla,
  kalanHakOlmali,
  kelimeleriSec,
  oyunuKaybet,
  oyunuKazan,
  paylasimMetni,
  paylasimOnizlemesi,
  sonucIstatistigi,
  tahtaKartlari,
  temizle,
  yanlisDortluler,
} from "./yardimcilar";

test("tam üç doğru kelime çok yakın sonucu verir ve bir hak götürür", async ({ page }) => {
  await page.goto("/play");
  await kelimeleriSec(page, birUzaktaDortlu());
  await grupla(page);

  await expect(geriBildirim(page)).toHaveAttribute("data-verdict", "one-away");
  await expect(geriBildirim(page)).toHaveText("Bir kelime uzaktasın.");
  await kalanHakOlmali(page, GAME_CONSTANTS.maxMistakes - 1);
  await expect(tahtaKartlari(page)).toHaveCount(GAME_CONSTANTS.wordCount);
});

test("aynı dörtlü farklı sırayla gönderilince hak eksilmez", async ({ page }) => {
  await page.goto("/play");
  const [ilkDortlu] = yanlisDortluler();

  await kelimeleriSec(page, ilkDortlu);
  await grupla(page);
  await expect(geriBildirim(page)).toHaveAttribute("data-verdict", "wrong");
  await kalanHakOlmali(page, GAME_CONSTANTS.maxMistakes - 1);

  await temizle(page);
  await kelimeleriSec(page, [...ilkDortlu].reverse());
  await grupla(page);

  await expect(geriBildirim(page)).toHaveAttribute("data-verdict", "repeated");
  await expect(geriBildirim(page)).toHaveText("Bu dörtlüyü daha önce denedin.");
  await kalanHakOlmali(page, GAME_CONSTANTS.maxMistakes - 1);
});

test("Grupla'ya hızlı çift basış tek gönderim olarak işlenir", async ({ page }) => {
  await page.goto("/play");
  const [ilkDortlu] = yanlisDortluler();
  await kelimeleriSec(page, ilkDortlu);

  await gonderDugmesi(page).dblclick();
  await kalanHakOlmali(page, GAME_CONSTANTS.maxMistakes - 1);

  await temizle(page);
  await oyunuKazan(page);

  const izgara = await paylasimMetni(page);
  expect(izgara.split("\n")).toHaveLength(1 + 1 + GAME_CONSTANTS.groupCount);
  await expect(sonucIstatistigi(page, "Hata")).toHaveText("1");
});

test("dördüncü yanlışta oyun biter ve kalan cevaplar açılır", async ({ page }) => {
  await page.goto("/play");
  const dortluler = yanlisDortluler();

  for (let sira = 0; sira < dortluler.length; sira += 1) {
    const dortlu = dortluler[sira];
    if (dortlu === undefined) continue;

    if (sira > 0) await temizle(page);
    await kelimeleriSec(page, dortlu);
    await grupla(page);

    const kalanHak = GAME_CONSTANTS.maxMistakes - (sira + 1);
    if (kalanHak > 0) {
      await expect(geriBildirim(page)).toHaveAttribute("data-verdict", "wrong");
      await kalanHakOlmali(page, kalanHak);
    }
  }

  await expect(page.getByRole("heading", { name: "Bugünlük bu kadar." })).toBeVisible();
  await expect(sonucIstatistigi(page, "Bulunan")).toHaveText(`0/${GAME_CONSTANTS.groupCount}`);
  await expect(sonucIstatistigi(page, "Hata")).toHaveText(String(GAME_CONSTANTS.maxMistakes));
  await expect(page.getByText("Cevap", { exact: true })).toHaveCount(GAME_CONSTANTS.groupCount);
  await expect(page.getByText("Bulundu", { exact: true })).toHaveCount(0);

  for (const grup of bulmaca.groups) {
    await expect(page.getByText(grupKelimeleri(grup).join(" · "))).toBeVisible();
  }

  await expect(paylasimOnizlemesi(page)).toContainText(`Quadro ${bulmaca.date} 0/4`);
});

test("kaybedilen oyunda tahta ve kontroller kaybolur", async ({ page }) => {
  await page.goto("/play");
  await oyunuKaybet(page);

  await expect(page.getByRole("heading", { name: "Bugünlük bu kadar." })).toBeVisible();
  await expect(tahtaKartlari(page)).toHaveCount(0);
  await expect(gonderDugmesi(page)).toHaveCount(0);
});
