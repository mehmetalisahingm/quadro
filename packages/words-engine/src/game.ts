import type { Board, Cell, Position } from "./board";
import { resolveConfig, type EngineConfig } from "./config";
import { naivePieceSource, type Piece, type PieceSource } from "./pieces";
import { clearedCells, findWords, scoreWords, type Dictionary, type FoundWord } from "./words";

/** Motorun sürümü: snapshot ve replay kayıtları bu değeri taşır. Kural değişince artar. */
export const ENGINE_VERSION = "0.1.0";

/** Tüm oyun durumu. Düz veri: JSON'a yazılabilir, snapshot'ın kendisidir. */
export type GameState = {
  readonly version: string;
  readonly seed: number;
  readonly config: EngineConfig;
  readonly board: Board;
  /** Her zaman trayCapacity uzunlukta; kullanılan yuva aynı hamlede yenilenir. */
  readonly tray: readonly Piece[];
  /** Parça kaynağının üreteç durumu. */
  readonly rng: number;
  readonly nextPieceId: number;
  readonly score: number;
  readonly moveCount: number;
  readonly wordCount: number;
  readonly over: boolean;
};

export type Move = { readonly slot: number; readonly row: number; readonly col: number };

export type MoveResult = {
  readonly placed: readonly Position[];
  readonly words: readonly FoundWord[];
  readonly cleared: readonly Position[];
  readonly points: number;
  readonly over: boolean;
};

export type MoveOutcome =
  | { readonly ok: true; readonly state: GameState; readonly result: MoveResult }
  | { readonly ok: false; readonly reason: "game-over" | "bad-slot" | "out-of-bounds" | "occupied" };

export type CreateGameOptions = {
  readonly seed: number;
  readonly config?: Partial<EngineConfig>;
  readonly source?: PieceSource;
};

function emptyBoard(size: number): Cell[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, (): Cell => null));
}

function drawPiece(state: { rng: number; nextPieceId: number; moveCount: number }, source: PieceSource) {
  const drawn = source(state.rng, { id: state.nextPieceId, moveCount: state.moveCount });
  return { piece: drawn.piece, rng: drawn.rng, nextPieceId: state.nextPieceId + 1 };
}

export function createGame({ seed, config: overrides, source = naivePieceSource }: CreateGameOptions): GameState {
  const config = resolveConfig(overrides);
  let rng = seed >>> 0;
  let nextPieceId = 1;
  const tray: Piece[] = [];
  for (let slot = 0; slot < config.trayCapacity; slot++) {
    const drawn = drawPiece({ rng, nextPieceId, moveCount: 0 }, source);
    tray.push(drawn.piece);
    rng = drawn.rng;
    nextPieceId = drawn.nextPieceId;
  }
  const state: GameState = {
    version: ENGINE_VERSION,
    seed: seed >>> 0,
    config,
    board: emptyBoard(config.boardSize),
    tray,
    rng,
    nextPieceId,
    score: 0,
    moveCount: 0,
    wordCount: 0,
    over: false,
  };
  return { ...state, over: !hasAnyLegalPlacement(state) };
}

function cellsOf(piece: Piece, row: number, col: number): Position[] {
  return piece.cells.map((c) => ({ row: row + c.dr, col: col + c.dc }));
}

/** Parça bu konuma (sol üst köşe) sığıyor mu: tüm hücreler tahtada ve boş. */
export function canPlace(state: GameState, slot: number, row: number, col: number): boolean {
  const piece = state.tray[slot];
  if (!piece) return false;
  const size = state.config.boardSize;
  return cellsOf(piece, row, col).every(
    (p) => p.row >= 0 && p.col >= 0 && p.row < size && p.col < size && state.board[p.row]?.[p.col] === null,
  );
}

/** Bir yuvadaki parçanın tüm yasal konumları, satır sonra sütun sırasıyla. */
export function legalPlacements(state: GameState, slot: number): Position[] {
  const result: Position[] = [];
  for (let row = 0; row < state.config.boardSize; row++) {
    for (let col = 0; col < state.config.boardSize; col++) {
      if (canPlace(state, slot, row, col)) result.push({ row, col });
    }
  }
  return result;
}

/** Oyun sonu kuralı: tepsideki hiçbir parçanın yasal yerleşimi yoksa oyun biter. */
export function hasAnyLegalPlacement(state: GameState): boolean {
  for (let slot = 0; slot < state.tray.length; slot++) {
    for (let row = 0; row < state.config.boardSize; row++) {
      for (let col = 0; col < state.config.boardSize; col++) {
        if (canPlace(state, slot, row, col)) return true;
      }
    }
  }
  return false;
}

/**
 * Bir hamleyi atomik uygular: ya hamlenin tamamı geçerlidir ve yeni durum döner,
 * ya hiçbir şey değişmez ve sebep döner. Girdi durumu asla değiştirilmez.
 *
 * Sıra: yerleştir → kelimeleri bul → puanla → hücreleri sil (yerçekimi yok) →
 * kullanılan yuvayı yenile → oyun sonunu denetle.
 */
export function applyMove(
  state: GameState,
  move: Move,
  dictionary: Dictionary,
  source: PieceSource = naivePieceSource,
): MoveOutcome {
  if (state.over) return { ok: false, reason: "game-over" };
  const piece = state.tray[move.slot];
  if (!piece || !Number.isInteger(move.slot)) return { ok: false, reason: "bad-slot" };
  const size = state.config.boardSize;
  const placed = cellsOf(piece, move.row, move.col);
  if (placed.some((p) => p.row < 0 || p.col < 0 || p.row >= size || p.col >= size)) return { ok: false, reason: "out-of-bounds" };
  if (placed.some((p) => state.board[p.row]?.[p.col] !== null)) return { ok: false, reason: "occupied" };

  const board = state.board.map((row) => [...row]);
  piece.cells.forEach((cell, index) => {
    const p = placed[index]!;
    board[p.row]![p.col] = cell.letter;
  });

  const words = findWords(board, placed, dictionary, state.config);
  const cleared = clearedCells(words);
  for (const p of cleared) board[p.row]![p.col] = null;
  const points = scoreWords(words, state.config);

  const drawn = drawPiece({ rng: state.rng, nextPieceId: state.nextPieceId, moveCount: state.moveCount + 1 }, source);
  const tray = state.tray.map((p, slot) => (slot === move.slot ? drawn.piece : p));

  const next: GameState = {
    ...state,
    board,
    tray,
    rng: drawn.rng,
    nextPieceId: drawn.nextPieceId,
    score: state.score + points,
    moveCount: state.moveCount + 1,
    wordCount: state.wordCount + words.length,
    over: false,
  };
  const over = !hasAnyLegalPlacement(next);
  return { ok: true, state: { ...next, over }, result: { placed, words, cleared, points, over } };
}
