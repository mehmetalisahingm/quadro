/**
 * Quadro oyun motoru: saf fonksiyonlar.
 *
 * Her fonksiyon bulmaca ve/veya `GameSnapshot` alır ve girdileri değiştirmeden yeni durum
 * döndürür; değişiklik yoksa aynı snapshot nesnesi döner. Rastgelelik `RandomSource` olarak
 * dışarıdan verilir. Kurallar docs/GAME_RULES.md, tipler contracts.ts içindedir.
 *
 * Katmanlar:
 * - Q09: kurulum (`createInitialSnapshot`), seçim (`toggleWord`, `clearSelection`,
 *   `readSelection`), karıştırma (`shuffleBoard`), doğru grup tespiti ve çözülmesi
 *   (`matchGroup`, `solveGroup`) ve tahmin geçmişi (`appendAttempt`).
 * - Q10: yanlış ve çok yakın tahminde hak tüketimi ve kaybetme (`classifyMistake`,
 *   `applyMistake`), sıradan bağımsız tekrar denetimi (`hasAttempted`) ve bu yapı taşlarını
 *   GAME_RULES.md §3 denetim sırasıyla birleştiren `submitSelection`:
 *   bitmiş oyun → `readSelection` → `hasAttempted` ile tekrar → `matchGroup` →
 *   `solveGroup` ya da `applyMistake`.
 */

export * from "./attempts";
export * from "./groups";
export * from "./lookup";
export * from "./mistakes";
export * from "./random";
export * from "./selection";
export * from "./setup";
export * from "./shuffle";
export * from "./submit";
