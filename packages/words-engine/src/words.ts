import type { Board, Position } from "./board";
import type { Direction, EngineConfig } from "./config";

/** Sözlük sözleşmesi. #204'ün trie'si bunu uygular; motor sözlüğün içini bilmez. */
export type Dictionary = { has(word: string): boolean };

export type FoundWord = {
  readonly word: string;
  readonly direction: Direction;
  /** Kelimenin ilk harfinin konumu. */
  readonly start: Position;
  readonly cells: readonly Position[];
  readonly points: number;
};

const key = ({ row, col }: Position) => `${row}:${col}`;

/** Bir doğrultudaki çizginin hücreleri: yatayda satır, dikeyde sütun. */
function lineCells(size: number, direction: Direction, index: number): Position[] {
  return Array.from({ length: size }, (_, offset) =>
    direction === "horizontal" ? { row: index, col: offset } : { row: offset, col: index },
  );
}

type Candidate = { word: string; from: number; to: number; cells: Position[] };

/**
 * Yeni yerleştirilen hücrelere dokunan kelimeleri bulur (kurallar: config.ts V1, V2).
 *
 * Her doğrultuda, yeni hücre içeren her çizgide, dolu hücrelerin kesintisiz dizileri taranır.
 * Aday = sözlükte olan, en az minWordLength uzunlukta ve en az bir yeni hücre içeren alt dizi.
 * Adaylar uzunluk (büyükten küçüğe), sonra başlangıç (küçükten büyüğe) sırasıyla açgözlü
 * seçilir; seçilenle çakışan aday atlanır. Sonuç tamamen deterministiktir.
 */
export function findWords(
  board: Board,
  placed: readonly Position[],
  dictionary: Dictionary,
  config: EngineConfig,
): FoundWord[] {
  const placedKeys = new Set(placed.map(key));
  const found: FoundWord[] = [];

  for (const direction of config.directions) {
    const lineIndexes = [...new Set(placed.map((p) => (direction === "horizontal" ? p.row : p.col)))].sort((a, b) => a - b);

    for (const lineIndex of lineIndexes) {
      const cells = lineCells(config.boardSize, direction, lineIndex);
      const candidates: Candidate[] = [];

      let runStart = 0;
      while (runStart < cells.length) {
        if (board[cells[runStart]!.row]?.[cells[runStart]!.col] == null) {
          runStart++;
          continue;
        }
        let runEnd = runStart;
        while (runEnd < cells.length && board[cells[runEnd]!.row]?.[cells[runEnd]!.col] != null) runEnd++;

        const run = cells.slice(runStart, runEnd);
        if (run.some((p) => placedKeys.has(key(p)))) {
          for (let from = 0; from < run.length; from++) {
            for (let to = from + config.minWordLength; to <= run.length; to++) {
              const slice = run.slice(from, to);
              if (!slice.some((p) => placedKeys.has(key(p)))) continue;
              const word = slice.map((p) => board[p.row]![p.col]!).join("");
              if (dictionary.has(word)) candidates.push({ word, from: runStart + from, to: runStart + to, cells: slice });
            }
          }
        }
        runStart = runEnd;
      }

      candidates.sort((a, b) => b.to - b.from - (a.to - a.from) || a.from - b.from);
      const taken: Candidate[] = [];
      for (const candidate of candidates) {
        if (taken.some((t) => candidate.from < t.to && t.from < candidate.to)) continue;
        taken.push(candidate);
      }
      taken.sort((a, b) => a.from - b.from);
      for (const t of taken) {
        found.push({
          word: t.word,
          direction,
          start: t.cells[0]!,
          cells: t.cells,
          points: config.lengthFactor * t.word.length ** 2,
        });
      }
    }
  }
  return found;
}

/** Hamlenin puanı (V3): kelime puanlarının toplamı × çoklu kelime çarpanı, aşağı yuvarlanır. */
export function scoreWords(words: readonly FoundWord[], config: EngineConfig): number {
  if (words.length === 0) return 0;
  const base = words.reduce((sum, w) => sum + w.points, 0);
  return Math.floor(base * (1 + config.comboStep * (words.length - 1)));
}

/** Kesişen hücreler bir kez silinir. Sıra: satır, sonra sütun. */
export function clearedCells(words: readonly FoundWord[]): Position[] {
  const unique = new Map<string, Position>();
  for (const w of words) for (const p of w.cells) unique.set(key(p), p);
  return [...unique.values()].sort((a, b) => a.row - b.row || a.col - b.col);
}
