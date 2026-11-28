import { describe, expect, it } from "vitest";

import type { Position } from "./board";
import { applyMove, createGame, hasAnyLegalPlacement, legalPlacements, type GameState, type Move } from "./game";
import { createRandom, seedFromString } from "./random";
import { parseState, replay, serializeState } from "./replay";
import { scoreWords, type Dictionary } from "./words";

/**
 * Bol kelimeli, deterministik sahte sözlük: dizelerin yaklaşık 1/12'si "kelime" sayılır.
 * Gerçek sözlükle temizleme nadir olur; burada amaç silme yolunu binlerce kez çalıştırmak.
 */
const permissive: Dictionary = { has: (word) => seedFromString(word) % 12 === 0 };

// Motor kaynağı DOM/Node tipi görmez; test özetini yazdırmak için yalnız burada bildirilir.
declare const console: { info(...values: unknown[]): void };

const SEEDS = 1200;
const MAX_MOVES = 250;
const key = (p: Position) => `${p.row}:${p.col}`;

function filled(state: GameState): number {
  return state.board.reduce((total, row) => total + row.filter((c) => c !== null).length, 0);
}

type Stats = { games: number; moves: number; words: number; endedByGameOver: number; maxScore: number };

function playOne(seed: number, stats: Stats): void {
  const bot = createRandom(seed ^ 0x5bd1e995);
  let state = createGame({ seed });
  const moves: Move[] = [];

  expect(state.tray).toHaveLength(state.config.trayCapacity);
  expect(state.over).toBe(!hasAnyLegalPlacement(state));

  while (!state.over && moves.length < MAX_MOVES) {
    const options = state.tray.flatMap((_, slot) => legalPlacements(state, slot).map((p) => ({ slot, ...p })));
    expect(options.length).toBeGreaterThan(0);
    const move = options[Math.floor(bot() * options.length)]!;
    const before = state;
    const outcome = applyMove(before, move, permissive);
    if (!outcome.ok) throw new Error(`seed ${seed}: yasal hamle reddedildi (${outcome.reason})`);
    const { state: next, result } = outcome;

    // Girdi durumu değişmemiş olmalı.
    expect(before.moveCount).toBe(moves.length);

    // Tahta: boyut sabit, her hücre boş ya da tek harf.
    expect(next.board).toHaveLength(next.config.boardSize);
    for (const row of next.board) {
      expect(row).toHaveLength(next.config.boardSize);
      for (const cell of row) expect(cell === null || [...cell].length === 1).toBe(true);
    }

    // Hücre muhasebesi: sonra = önce + konan − silinen.
    expect(filled(next)).toBe(filled(before) + result.placed.length - result.cleared.length);
    const clearedKeys = new Set(result.cleared.map(key));
    for (const p of result.cleared) expect(next.board[p.row]![p.col]).toBeNull();
    for (const p of result.placed) if (!clearedKeys.has(key(p))) expect(next.board[p.row]![p.col]).not.toBeNull();

    // Her kelime: sözlükte, yeterince uzun, yeni hücre içeriyor, silinen hücrelerde.
    const placedKeys = new Set(result.placed.map(key));
    for (const word of result.words) {
      expect(permissive.has(word.word)).toBe(true);
      expect(word.word.length).toBeGreaterThanOrEqual(next.config.minWordLength);
      expect([...word.word]).toHaveLength(word.cells.length);
      expect(word.cells.some((p) => placedKeys.has(key(p)))).toBe(true);
      for (const p of word.cells) expect(clearedKeys.has(key(p))).toBe(true);
    }

    // Puan ve sayaçlar.
    expect(result.points).toBe(scoreWords(result.words, next.config));
    expect(next.score).toBe(before.score + result.points);
    expect(next.moveCount).toBe(before.moveCount + 1);
    expect(next.wordCount).toBe(before.wordCount + result.words.length);

    // Tepsi: kapasite sabit, kullanılan yuvaya yeni kimlikli parça, diğerleri aynı.
    expect(next.tray).toHaveLength(next.config.trayCapacity);
    next.tray.forEach((piece, slot) => {
      if (slot === move.slot) expect(piece.id).toBe(before.nextPieceId);
      else expect(piece).toBe(before.tray[slot]);
    });

    // Oyun sonu kuralı.
    expect(next.over).toBe(!hasAnyLegalPlacement(next));
    expect(result.over).toBe(next.over);

    moves.push(move);
    stats.words += result.words.length;
    state = next;
  }

  // Replay ve kayıt: aynı tohum + hamleler aynı durumu verir; kayıt kayıpsız geri yüklenir.
  const replayed = replay({ version: state.version, seed, config: state.config, moves }, permissive);
  if (!replayed.ok) throw new Error(`seed ${seed}: replay başarısız (${replayed.reason})`);
  expect(serializeState(replayed.state)).toBe(serializeState(state));
  expect(parseState(serializeState(state))).toEqual(state);

  stats.games++;
  stats.moves += moves.length;
  if (state.over) stats.endedByGameOver++;
  stats.maxScore = Math.max(stats.maxScore, state.score);
}

describe(`${SEEDS} tohumla değişmezler`, () => {
  it("her hamlede tahta, puan, tepsi ve oyun sonu tutarlı; replay birebir", () => {
    const stats: Stats = { games: 0, moves: 0, words: 0, endedByGameOver: 0, maxScore: 0 };
    for (let seed = 1; seed <= SEEDS; seed++) playOne(seed, stats);
    expect(stats.games).toBe(SEEDS);
    // Testin gerçekten silme yolunu çalıştırdığını ve oyunların bittiğini doğrula.
    expect(stats.words).toBeGreaterThan(SEEDS);
    expect(stats.endedByGameOver).toBeGreaterThan(SEEDS / 2);
    console.info(`[invariants] ${stats.games} oyun, ${stats.moves} hamle, ${stats.words} kelime, ${stats.endedByGameOver} oyun sonu, en yüksek skor ${stats.maxScore}`);
  }, 120_000);
});
