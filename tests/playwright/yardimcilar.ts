/**
 * Q17 tarayıcı regresyonlarının ortak yardımcıları.
 *
 * Kelimeler, grup başlıkları ve beklenen başlangıç sırası doğrudan fixture ve gerçek
 * motordan hesaplanır. Testler canlı günlük cevaba bağlı değildir.
 */

import { expect, type Locator, type Page } from "@playwright/test";

import type { PuzzleGroup } from "@/features/game/contracts";
import { createInitialSnapshot, createSeededRandom } from "@/features/game/engine";
import { standardPuzzle } from "@/features/game/fixtures/puzzles";
import { DEFAULT_ENGINE_SEED } from "@/features/game/react/engineController";

export const bulmaca = standardPuzzle;

const [birinciGrup, ikinciGrup, ucuncuGrup, dorduncuGrup] = bulmaca.groups;

export type Dortlu = [string, string, string, string];

export function grupKelimeleri(grup: PuzzleGroup): Dortlu {
  const [a, b, c, d] = grup.words;
  return [a.text, b.text, c.text, d.text];
}

export function beklenenBaslangicSirasi(): string[] {
  const snapshot = createInitialSnapshot(bulmaca, {
    random: createSeededRandom(DEFAULT_ENGINE_SEED),
  });

  const metinById = new Map(
    bulmaca.groups.flatMap((grup) =>
      grup.words.map((kelime) => [kelime.id, kelime.text] as const),
    ),
  );

  return snapshot.remainingWordOrder.map((wordId) => {
    const metin = metinById.get(wordId);
    if (metin === undefined) {
      throw new Error(`Beklenen sıra üretilemedi: bilinmeyen kelime kimliği "${wordId}".`);
    }
    return metin;
  });
}

export function yanlisDortluler(): [Dortlu, Dortlu, Dortlu, Dortlu] {
  const [a1, a2, a3, a4] = grupKelimeleri(birinciGrup);
  const [b1, b2, b3, b4] = grupKelimeleri(ikinciGrup);
  const [c1, c2, c3, c4] = grupKelimeleri(ucuncuGrup);
  const [d1, d2, d3, d4] = grupKelimeleri(dorduncuGrup);

  return [
    [a1, a2, b1, b2],
    [a3, a4, b3, b4],
    [c1, c2, d1, d2],
    [c3, c4, d3, d4],
  ];
}

export function birUzaktaDortlu(): Dortlu {
  const [a1, a2, a3] = grupKelimeleri(birinciGrup);
  const [b1] = grupKelimeleri(ikinciGrup);
  return [a1, a2, a3, b1];
}

export function spoilerMetinleri(): string[] {
  return bulmaca.groups.flatMap((grup) => [grup.title, ...grup.words.map((k) => k.text)]);
}

export function kelimeKarti(page: Page, metin: string): Locator {
  return page.getByRole("button", { name: metin, exact: true });
}

export function tahtaKartlari(page: Page): Locator {
  return page.getByLabel(/oyun tahtası$/).getByRole("button");
}

export async function tahtaSirasi(page: Page): Promise<string[]> {
  return tahtaKartlari(page).allInnerTexts();
}

export function gonderDugmesi(page: Page): Locator {
  return page.getByRole("button", { name: /Grupla|Kontrol ediliyor/ });
}

export function karistirDugmesi(page: Page): Locator {
  return page.getByRole("button", { name: "Karıştır", exact: true });
}

export function temizleDugmesi(page: Page): Locator {
  return page.getByRole("button", { name: "Temizle", exact: true });
}

export function kalanHakDurumu(page: Page): Locator {
  return page.getByText(/^\d+ hata hakkı kaldı$/);
}

export function secimSayaci(page: Page): Locator {
  return page.getByText(/^\d\/4 seçili$/);
}

export function geriBildirim(page: Page): Locator {
  return page.locator("[data-verdict]");
}

export function sonucIstatistigi(page: Page, etiket: string): Locator {
  return page
    .locator(".q-result-stats > div")
    .filter({ has: page.getByText(etiket, { exact: true }) })
    .locator("dd");
}

export function paylasimOnizlemesi(page: Page): Locator {
  return page.getByLabel("Spoilersız paylaşım önizlemesi");
}

export async function paylasimMetni(page: Page): Promise<string> {
  const metin = await paylasimOnizlemesi(page).textContent();
  if (metin === null) throw new Error("Paylaşım önizlemesi bulunamadı.");
  return metin;
}

export async function kelimeleriSec(page: Page, metinler: readonly string[]): Promise<void> {
  for (const metin of metinler) {
    await kelimeKarti(page, metin).click();
  }
}

export async function grupla(page: Page): Promise<void> {
  await gonderDugmesi(page).click();
}

export async function temizle(page: Page): Promise<void> {
  await temizleDugmesi(page).click();
}

export async function kalanHakOlmali(page: Page, kalan: number): Promise<void> {
  await expect(kalanHakDurumu(page)).toHaveText(`${kalan} hata hakkı kaldı`);
}

export async function oyunuKazan(page: Page): Promise<void> {
  for (const grup of bulmaca.groups) {
    await kelimeleriSec(page, grupKelimeleri(grup));
    await grupla(page);
  }
}

export async function oyunuKaybet(page: Page): Promise<void> {
  const dortluler = yanlisDortluler();

  for (let index = 0; index < dortluler.length; index += 1) {
    const dortlu = dortluler[index];
    if (dortlu === undefined) continue;

    if (index > 0) await temizle(page);
    await kelimeleriSec(page, dortlu);
    await grupla(page);
  }
}
