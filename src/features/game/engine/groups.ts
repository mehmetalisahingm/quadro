/**
 * Doğru grup tespiti ve çözülmesi (docs/GAME_RULES.md §3 "correct" ve §4 kazanma).
 */

import {
  GAME_CONSTANTS,
  attemptKey,
  type Four,
  type GameSnapshot,
  type Puzzle,
  type PuzzleGroup,
  type SubmitResult,
  type WordId,
} from "@/features/game/contracts";

import { appendAttempt } from "./attempts";
import { findGroupOfWord, groupWordIds, isPlaying } from "./lookup";

/**
 * Dörtlünün bulmacadaki gruplarla eşleşmesi.
 *
 * - `group`: dört farklı kelime aynı gruptan.
 * - `no-group`: eşleşme yok; `largestShare`, dörtlüde en çok kelimesi bulunan grubun kelime
 *   sayısıdır (0–3). Çok yakın kararı bu değerden verilir (Q10).
 */
export type GroupMatch =
  | { kind: "group"; group: PuzzleGroup }
  | { kind: "no-group"; largestShare: number };

/**
 * Dörtlünün bir grubu tam olarak oluşturup oluşturmadığını bulur. Kelimeler farklı kimlikler
 * olarak sayılır; tekrar eden kimlik bir grubu tamamlamaz. Bilinmeyen kimlik hiçbir gruba
 * sayılmaz. Çözülmüş grup denetimi `readSelection` ile önceden yapılır.
 */
export function matchGroup(puzzle: Puzzle, wordIds: Four<WordId>): GroupMatch {
  const counts = new Map<PuzzleGroup, number>();
  for (const wordId of new Set(wordIds)) {
    const group = findGroupOfWord(puzzle, wordId);
    if (group) counts.set(group, (counts.get(group) ?? 0) + 1);
  }

  let largestShare = 0;
  for (const [group, count] of counts) {
    if (count === GAME_CONSTANTS.groupSize) return { kind: "group", group };
    largestShare = Math.max(largestShare, count);
  }
  return { kind: "no-group", largestShare };
}

/**
 * Doğru dörtlüyü çözer ve sözleşmedeki gönderim sonucunu döndürür:
 *
 * - Grup `solvedGroupIds` sonuna eklenir, kelimeleri `remainingWordOrder`'dan çıkar.
 * - Seçim temizlenir, hak değişmez, geçmişe `correct` kaydı eklenir.
 * - Son grup çözüldüyse `status = "won"` olur; sözleşme gereği bu bilgi aynı sonuçta taşınır.
 * - `outcome = { verdict: "correct", solvedGroup: group }`.
 *
 * Ön koşullar: oyun sürüyor, grup henüz çözülmemiş ve `wordIds` tam olarak grubun kelimeleri
 * (sıra önemsiz). Gönderim akışı bunları `readSelection` ve {@link matchGroup} ile sağlar.
 *
 * @throws Ön koşul ihlalinde. Bu bir programlama hatasıdır; oyuncu girdisiyle oluşmaz.
 */
export function solveGroup(
  snapshot: GameSnapshot,
  wordIds: Four<WordId>,
  group: PuzzleGroup,
): SubmitResult {
  if (!isPlaying(snapshot)) {
    throw new Error(`solveGroup: oyun sürmüyor (status: ${snapshot.status}).`);
  }
  if (snapshot.solvedGroupIds.includes(group.id)) {
    throw new Error(`solveGroup: "${group.id}" grubu zaten çözülmüş.`);
  }
  if (attemptKey(wordIds) !== attemptKey(groupWordIds(group))) {
    throw new Error(`solveGroup: dörtlü "${group.id}" grubunun kelimeleri değil.`);
  }

  const solvedWordIds = new Set<WordId>(wordIds);
  const solvedGroupIds = [...snapshot.solvedGroupIds, group.id];
  return {
    outcome: { verdict: "correct", solvedGroup: group },
    snapshot: {
      ...snapshot,
      status: solvedGroupIds.length === GAME_CONSTANTS.groupCount ? "won" : "playing",
      selectedWordIds: [],
      remainingWordOrder: snapshot.remainingWordOrder.filter((id) => !solvedWordIds.has(id)),
      solvedGroupIds,
      attempts: appendAttempt(snapshot, wordIds, "correct"),
    },
  };
}
