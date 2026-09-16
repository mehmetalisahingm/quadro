/**
 * Motorun rastgelelik araçları.
 *
 * Motor fonksiyonları rastgelelik üretmez; `RandomSource` dışarıdan verilir. Tohumlu kaynakla
 * aynı girdiler her ortamda aynı sonucu verir; böylece karıştırma deterministik test edilir ve
 * sunucu ile istemci aynı başlangıç tahtasını çizer.
 */

import type { WordId } from "@/features/game/contracts";

/** `[0, 1)` aralığında sayı üreten kaynak: tohumlu üreteç veya `Math.random`. */
export type RandomSource = () => number;

/**
 * Tohumlu, deterministik sayı üreteci (mulberry32). Aynı tohum her ortamda aynı diziyi verir.
 * Dönen fonksiyon her çağrıda kendi iç durumunu ilerletir.
 */
export function createSeededRandom(seed: number): RandomSource {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Kimliklerin karıştırılmış yeni bir kopyasını döndürür (Fisher–Yates); girdiyi değiştirmez.
 * Kaynaktan en fazla `ids.length - 1` sayı tüketir.
 */
export function shuffleWordIds(ids: readonly WordId[], random: RandomSource): WordId[] {
  const result = [...ids];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const current = result[i];
    const other = result[j];
    if (current === undefined || other === undefined) continue;
    result[i] = other;
    result[j] = current;
  }
  return result;
}
