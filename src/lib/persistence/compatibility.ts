/**
 * Kaydın bugünkü bulmacaya uygunluğu (Q20).
 *
 * Yapısal olarak okunabilen her kayıt oynanabilir değildir. Bir kayıt ancak
 * **aynı bulmacanın, aynı revizyonun ve aynı yayın gününün** durumuysa tahtaya
 * uygulanır; ayrıca tahtanın 16 kelimesiyle ve motorun değişmezleriyle tutarlı
 * olmalıdır. Aksi halde kayıt sessizce düşer ve oyun taze başlar.
 *
 * Denetimler burada toplanır, çünkü hepsi aynı soruyu yanıtlar: "bu durum bu
 * bulmacanın durumu olabilir mi?". Fonksiyon saftır; bulmacayı ve durumu
 * değiştirmez, hata fırlatmaz.
 */

import {
  GAME_CONSTANTS,
  type GameSnapshot,
  type GameStatus,
  type Puzzle,
  type PuzzleGroup,
  type WordId,
} from "@/features/game/contracts";

/** Kaydın neden bu bulmacaya uygulanamadığı. */
export type IncompatibleReason =
  /** Başka bir bulmacanın ya da düzeltilmiş bir revizyonun kaydı. */
  | "puzzle-mismatch"
  /** Başka bir yayın gününün kaydı: dünün oyunu bugüne taşınmaz. */
  | "day-mismatch"
  /** Çözülmüş diye işaretlenen grup bulmacada yok. */
  | "group-mismatch"
  /** Tahtadaki kelimeler bulmacanın 16 kelimesiyle örtüşmüyor. */
  | "word-set-mismatch"
  /** Alanlar kendi içinde motorun üretemeyeceği bir durumu anlatıyor. */
  | "state-mismatch";

/** {@link checkCompatibility} sonucu. */
export type CompatibilityResult = { ok: true } | { ok: false; reason: IncompatibleReason };

const uygun: CompatibilityResult = { ok: true };
const ret = (reason: IncompatibleReason): CompatibilityResult => ({ ok: false, reason });

/** Grubun dört kelime kimliği. */
const wordIdsOf = (group: PuzzleGroup): WordId[] => group.words.map((word) => word.id);

/**
 * Çözülmüş grupları bulmacada bulur; kimliklerden biri bilinmiyorsa `null`.
 * Tekrarlanan kimlik yapısal çözümlemede elenmiştir.
 */
function findSolvedGroups(puzzle: Puzzle, solvedGroupIds: readonly string[]): PuzzleGroup[] | null {
  const groups: PuzzleGroup[] = [];
  for (const groupId of solvedGroupIds) {
    const group = puzzle.groups.find((candidate) => candidate.id === groupId);
    if (group === undefined) return null;
    groups.push(group);
  }
  return groups;
}

/**
 * Tahta bütünlüğü: çözülmemiş kartlar ile çözülmüş grupların kelimeleri
 * birlikte bulmacanın 16 kelimesini tam olarak vermeli.
 *
 * Kart sırasının kendisi serbesttir (oyuncu karıştırmış olabilir); denetlenen,
 * sıradaki kimliklerin hangi kümeyi oluşturduğudur. Bu sayede başka bir
 * bulmacadan ya da yarım yazılmış bir kayıttan gelen kimlikler tahtaya düşmez.
 */
function hasIntactBoard(puzzle: Puzzle, snapshot: GameSnapshot, solved: PuzzleGroup[]): boolean {
  const solvedWordIds = new Set(solved.flatMap(wordIdsOf));
  const expected = puzzle.groups
    .flatMap(wordIdsOf)
    .filter((wordId) => !solvedWordIds.has(wordId));

  if (snapshot.remainingWordOrder.length !== expected.length) return false;

  const remaining = new Set(snapshot.remainingWordOrder);
  return expected.every((wordId) => remaining.has(wordId));
}

/** Çözülen grup ve kalan hak sayısının gerektirdiği yaşam döngüsü durumu. */
function expectedStatus(won: boolean, lost: boolean): GameStatus {
  if (won) return "won";
  if (lost) return "lost";
  return "playing";
}

/**
 * Alanların kendi içinde tutarlılığı: durum, hak, çözülen grup ve tahmin sayısı
 * motorun ürettiği değerlerle örtüşmeli.
 *
 * Kurallar motorun değişmezleridir (docs/GAME_RULES.md §3–§4):
 * - Her hak tüketen tahmin bir hak eksiltir: `4 - kalan hak` kadar `one-away`/`wrong` kaydı olur.
 * - Her doğru tahmin bir grup çözer: doğru kayıt sayısı çözülen grup sayısına eşittir.
 * - Dört grup çözüldüyse oyun `won`, hak bittiyse `lost`, ikisi de değilse `playing`.
 * - Terminal durumda seçim boştur; sürerken seçim yalnız çözülmemiş kartlardan oluşur.
 *
 * Bu denetim "iki kez bitiş" korumasının da parçasıdır: kazanılmış bir oyunu
 * `playing` gibi gösteren ya da hakkı geri doldurulmuş bir kayıt kabul edilmez.
 */
function isSelfConsistent(snapshot: GameSnapshot): boolean {
  const { status, mistakesRemaining, solvedGroupIds, attempts, selectedWordIds } = snapshot;

  const mistakes = attempts.filter((attempt) => attempt.verdict !== "correct").length;
  if (mistakes !== GAME_CONSTANTS.maxMistakes - mistakesRemaining) return false;

  const correct = attempts.length - mistakes;
  if (correct !== solvedGroupIds.length) return false;
  if (solvedGroupIds.length > GAME_CONSTANTS.groupCount) return false;

  const won = solvedGroupIds.length === GAME_CONSTANTS.groupCount;
  const lost = mistakesRemaining === 0;
  // Motor aynı anda ikisini üretemez: hak biten oyunda yeni grup çözülemez.
  if (won && lost) return false;
  if (status !== expectedStatus(won, lost)) return false;

  if (status !== "playing") return selectedWordIds.length === 0;

  const remaining = new Set(snapshot.remainingWordOrder);
  return selectedWordIds.every((wordId) => remaining.has(wordId));
}

/**
 * Kaydın bugünkü bulmacaya uygulanıp uygulanamayacağını söyler.
 *
 * Denetimler dıştan içe sıralanır: önce kaydın hangi bulmacanın hangi gününe
 * ait olduğu, sonra tahtanın bütünlüğü, en sonda durumun kendi içindeki
 * tutarlılığı. İlk başarısız kural sonucu belirler.
 *
 * @param dayKey Bugünün yayın günü; sunucunun çözdüğü gün anahtarı.
 */
export function checkCompatibility(
  puzzle: Puzzle,
  dayKey: string,
  snapshot: GameSnapshot,
): CompatibilityResult {
  if (snapshot.puzzleId !== puzzle.id || snapshot.puzzleRevision !== puzzle.revision) {
    return ret("puzzle-mismatch");
  }
  if (snapshot.dayKey !== dayKey) return ret("day-mismatch");

  const solved = findSolvedGroups(puzzle, snapshot.solvedGroupIds);
  if (solved === null) return ret("group-mismatch");

  if (!hasIntactBoard(puzzle, snapshot, solved)) return ret("word-set-mismatch");
  if (!isSelfConsistent(snapshot)) return ret("state-mismatch");

  return uygun;
}
