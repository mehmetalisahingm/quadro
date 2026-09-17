/**
 * Q17 tarayıcı regresyonlarının ortak yardımcıları.
 *
 * Buradaki hiçbir değer teste elle gömülmez: kelimeler, grup başlıkları ve beklenen
 * başlangıç sırası doğrudan `standardPuzzle`'dan ve gerçek motordan (`createInitialSnapshot`
 * + `DEFAULT_ENGINE_SEED`) hesaplanır. Bulmaca içeriği değişirse testler kendiliğinden
 * yeni içeriğe uyar; canlı günün cevaplarına hiç bağımlı değildir.
 *
 * Tahtadaki kartlar konuma göre değil erişilebilir isimlerine göre hedeflenir.
 */

import { expect, type Locator, type Page } from "@playwright/test";

import type { PuzzleGroup } from "@/features/game/contracts";
import { createInitialSnapshot, createSeededRandom } from "@/features/game/engine";
import { standardPuzzle } from "@/features/game/fixtures/puzzles";
import { DEFAULT_ENGINE_SEED } from "@/features/game/react/engineController";

/** `/play` sayfasının açtığı bulmaca (Q16 ile bağlanan varsayılan içerik). */
export const bulmaca = standardPuzzle;

const [birinciGrup, ikinciGrup, ucuncuGrup, dorduncuGrup] = bulmaca.groups;

/** Dört kelimelik demet; grup kelimeleri ve gönderilen dörtlüler bu biçimdedir. */
export type Dortlu = [string, string, string, string];

/** Bir grubun kelime metinleri, içerikteki sırayla. */
export function grupKelimeleri(grup: PuzzleGroup): Dortlu {
  const [a, b, c, d] = grup.words;
  return [a.text, b.text, c.text, d.text];
}

/**
 * Motorun sabit tohumla üreteceği başlangıç tahta sırası.
 *
 * `useGame` → `createEngineController` ile birebir aynı kurulum tekrarlanır; böylece
 * beklenen sıra testte sabit yazılmadan hesaplanır.
 */
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

/**
 * Hiçbir grubu tamamlamayan dört ayrı dörtlü: her biri iki gruptan ikişer kelime aldığı
 * için motor bunları `wrong` sayar (`one-away` değil) ve her biri bir hak tüketir.
 * Dördü de birbirinden farklıdır, yani hiçbiri `repeated` sayılmaz.
 */
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

/** Tam üçü aynı gruptan olan dörtlü: motor `one-away` döndürür ve bir hak tüketir. */
export function birUzaktaDortlu(): Dortlu {
  const [a1, a2, a3] = grupKelimeleri(birinciGrup);
  const [b1] = grupKelimeleri(ikinciGrup);
  return [a1, a2, a3, b1];
}

/** Paylaşım metninde asla geçmemesi gereken metinler: kelimeler ve kategori başlıkları. */
export function spoilerMetinleri(): string[] {
  return bulmaca.groups.flatMap((grup) => [grup.title, ...grup.words.map((k) => k.text)]);
}

// ---------------------------------------------------------------------------
// Konumlandırıcılar
// ---------------------------------------------------------------------------

/** Tahtadaki tek kelime kartı; erişilebilir ismiyle hedeflenir. */
export function kelimeKarti(page: Page, metin: string): Locator {
  return page.getByRole("button", { name: metin, exact: true });
}

/** Oyun tahtasındaki tüm kartlar, DOM sırasıyla. */
export function tahtaKartlari(page: Page): Locator {
  return page.getByLabel(/oyun tahtası$/).getByRole("button");
}

/** Tahtadaki kelimelerin görünen sırası. */
export async function tahtaSirasi(page: Page): Promise<string[]> {
  return tahtaKartlari(page).allInnerTexts();
}

/**
 * Gönderim düğmesi. Gönderim işlenirken metni "Kontrol ediliyor…" olduğu için iki
 * duruma da uyan bir isim kalıbı kullanılır.
 */
export function gonderDugmesi(page: Page): Locator {
  return page.getByRole("button", { name: /Grupla|Kontrol ediliyor/ });
}

export function karistirDugmesi(page: Page): Locator {
  return page.getByRole("button", { name: "Karıştır", exact: true });
}

export function temizleDugmesi(page: Page): Locator {
  return page.getByRole("button", { name: "Temizle", exact: true });
}

/**
 * Hata hakkı sayacının ekran okuyucu metni.
 *
 * Kalıp baştan sona sabitlenir: sabitlenmezse kapsayıcı `.q-mistake-meter` de eşleşir ve
 * Playwright strict mode iki eşleşmede hata verir.
 */
export function kalanHakDurumu(page: Page): Locator {
  return page.getByText(/^\d+ hata hakkı kaldı$/);
}

/** Seçili kelime sayacı ("2/4 seçili"). Kalıp yine baştan sona sabitlenir. */
export function secimSayaci(page: Page): Locator {
  return page.getByText(/^\d\/4 seçili$/);
}

/** Gönderim geri bildirimi kabı; `data-verdict` motorun sonucunu birebir yansıtır. */
export function geriBildirim(page: Page): Locator {
  return page.locator("[data-verdict]");
}

/** Sonuç ekranındaki bir istatistiğin değeri (`Bulunan`, `Hata`, `Süre`). */
export function sonucIstatistigi(page: Page, etiket: string): Locator {
  return page
    .locator(".q-result-stats > div")
    .filter({ has: page.getByText(etiket, { exact: true }) })
    .locator("dd");
}

/** Spoilersız paylaşım metninin önizlemesi. */
export function paylasimOnizlemesi(page: Page): Locator {
  return page.getByLabel("Spoilersız paylaşım önizlemesi");
}

/**
 * Önizlemedeki paylaşım metninin ham hali.
 *
 * `innerText` yerine `textContent` kullanılır: Chromium `<pre>` içeriğini yerleşime göre
 * döndürürken satır sonlarına boşluk ekleyebiliyor, `textContent` ise DOM'daki metnin
 * birebir kendisidir. Panoya yazılan metinle karşılaştırma ancak böyle anlamlı olur.
 */
export async function paylasimMetni(page: Page): Promise<string> {
  const metin = await paylasimOnizlemesi(page).textContent();
  if (metin === null) {
    throw new Error("Paylaşım önizlemesi bulunamadı.");
  }
  return metin;
}

// ---------------------------------------------------------------------------
// Eylemler
// ---------------------------------------------------------------------------

/** Verilen kelimeleri sırayla seçer; kartlar kilitliyse Playwright açılmasını bekler. */
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

/** Kalan hakkın beklenen değere ulaşmasını bekler. */
export async function kalanHakOlmali(page: Page, kalan: number): Promise<void> {
  await expect(kalanHakDurumu(page)).toHaveText(`${kalan} hata hakkı kaldı`);
}

/** Dört grubu da doğru gönderip oyunu kazanır. */
export async function oyunuKazan(page: Page): Promise<void> {
  for (const grup of bulmaca.groups) {
    await kelimeleriSec(page, grupKelimeleri(grup));
    await grupla(page);
  }
}

/**
 * Dört ayrı yanlış dörtlü göndererek oyunu kaybeder.
 *
 * Yanlış gönderimden sonra seçim korunduğu için her turdan önce seçim boşaltılır.
 */
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
