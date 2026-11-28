/**
 * Tohumlu, deterministik rastgele sayı üreteci (mulberry32).
 *
 * Aynı tohum her platformda aynı diziyi verir; replay doğrulaması (#205, #218)
 * ve günlük ortak tohum (#217) buna dayanır. `Math.random` motorda kullanılmaz.
 *
 * Motor içinde üreteç durumu oyun durumunun parçasıdır (`randomStep`): böylece
 * snapshot'tan devam eden bir oyun, kesintisiz oynanmış olanla aynı diziyi üretir.
 */
export type Random = () => number;

/** Bir adım ilerler: [0, 1) aralığında değer ve yeni durum. Saf fonksiyon. */
export function randomStep(state: number): { value: number; state: number } {
  const next = (state + 0x6d2b79f5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, state: next };
}

/** Kapanış tabanlı kısayol: testler ve botlar için. */
export function createRandom(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    const step = randomStep(state);
    state = step.state;
    return step.value;
  };
}

/** Bir metni (ör. "2026-11-27") 32 bitlik tohuma çevirir (FNV-1a). */
export function seedFromString(text: string): number {
  let hash = 0x811c9dc5;
  for (const unit of text) {
    hash ^= unit.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}
