/**
 * Tahta kontrollerinin tarayıcı regresyonları: Karıştır ve Temizle.
 */

import { expect, test } from "@playwright/test";

import { GAME_CONSTANTS } from "@/features/game/contracts";

import {
  birUzaktaDortlu,
  bulmaca,
  grupKelimeleri,
  grupla,
  kalanHakOlmali,
  karistirDugmesi,
  kelimeKarti,
  kelimeleriSec,
  secimSayaci,
  tahtaKartlari,
  tahtaSirasi,
  temizle,
  temizleDugmesi,
} from "./yardimcilar";

test("Karıştır kart sırasını değiştirir ama seçimi ve hakları korur", async ({ page }) => {
  await page.goto("/play");

  const [birinciGrup] = bulmaca.groups;
  const [ilkKelime, ikinciKelime] = grupKelimeleri(birinciGrup);

  await kelimeleriSec(page, [ilkKelime, ikinciKelime]);
  await expect(secimSayaci(page)).toHaveText(`2/${GAME_CONSTANTS.groupSize} seçili`);

  const oncekiSira = await tahtaSirasi(page);

  await karistirDugmesi(page).click();

  // Karıştırma yalnız sırayı değiştirir.
  await expect
    .poll(async () => (await tahtaSirasi(page)).join("|"))
    .not.toBe(oncekiSira.join("|"));

  const sonrakiSira = await tahtaSirasi(page);
  expect([...sonrakiSira].sort()).toEqual([...oncekiSira].sort());

  // Seçim kimlikle tutulduğu için kartlar yeni yerlerinde seçili kalır.
  await expect(kelimeKarti(page, ilkKelime)).toHaveAttribute("aria-pressed", "true");
  await expect(kelimeKarti(page, ikinciKelime)).toHaveAttribute("aria-pressed", "true");
  await expect(secimSayaci(page)).toHaveText(`2/${GAME_CONSTANTS.groupSize} seçili`);

  await kalanHakOlmali(page, GAME_CONSTANTS.maxMistakes);
  await expect(tahtaKartlari(page)).toHaveCount(GAME_CONSTANTS.wordCount);
});

test("Temizle seçimi boşaltır ve hakları etkilemez", async ({ page }) => {
  await page.goto("/play");

  const secilenler = birUzaktaDortlu().slice(0, 3);
  await kelimeleriSec(page, secilenler);
  await expect(secimSayaci(page)).toHaveText(`3/${GAME_CONSTANTS.groupSize} seçili`);

  await temizle(page);

  await expect(secimSayaci(page)).toHaveText(`0/${GAME_CONSTANTS.groupSize} seçili`);
  for (const kelime of secilenler) {
    await expect(kelimeKarti(page, kelime)).toHaveAttribute("aria-pressed", "false");
  }

  // Seçim boşken Temizle yeniden basılamaz.
  await expect(temizleDugmesi(page)).toBeDisabled();
  await kalanHakOlmali(page, GAME_CONSTANTS.maxMistakes);
});

test("dörtten fazla kelime seçilemez", async ({ page }) => {
  await page.goto("/play");

  const [birinciGrup, ikinciGrup] = bulmaca.groups;
  await kelimeleriSec(page, grupKelimeleri(birinciGrup));
  await expect(secimSayaci(page)).toHaveText(
    `${GAME_CONSTANTS.groupSize}/${GAME_CONSTANTS.groupSize} seçili`,
  );

  // Beşinci kart etkisizdir: sayaç ve kartın basılı durumu değişmez.
  const [besinciKelime] = grupKelimeleri(ikinciGrup);
  await kelimeKarti(page, besinciKelime).click();

  await expect(kelimeKarti(page, besinciKelime)).toHaveAttribute("aria-pressed", "false");
  await expect(secimSayaci(page)).toHaveText(
    `${GAME_CONSTANTS.groupSize}/${GAME_CONSTANTS.groupSize} seçili`,
  );

  // Seçim hâlâ geçerli olduğu için gönderim doğru grubu çözer.
  await grupla(page);
  await expect(page.getByLabel(`Çözülen grup: ${birinciGrup.title}`)).toBeVisible();
});
