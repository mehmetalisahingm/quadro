import { describe, expect, it } from "vitest";

import { BOARD_SIZE, cellAt, countFilled, createBoard, createRandom, isInside, seedFromString } from "./index";

describe("tahta", () => {
  it("7×7 boş tahta oluşturur", () => {
    const board = createBoard();
    expect(board).toHaveLength(BOARD_SIZE);
    expect(board.every((row) => row.length === BOARD_SIZE && row.every((cell) => cell === null))).toBe(true);
    expect(countFilled(board)).toBe(0);
  });

  it("sınır dışını tanır ve oradan boş hücre döndürür", () => {
    const board = createBoard();
    expect(isInside(board, { row: 0, col: 0 })).toBe(true);
    expect(isInside(board, { row: 6, col: 6 })).toBe(true);
    expect(isInside(board, { row: 7, col: 0 })).toBe(false);
    expect(isInside(board, { row: -1, col: 3 })).toBe(false);
    expect(cellAt(board, { row: 9, col: 9 })).toBeNull();
  });
});

describe("deterministik rastgelelik", () => {
  it("aynı tohum aynı diziyi verir, farklı tohum farklı diziyi", () => {
    const sequence = (seed: number) => {
      const random = createRandom(seed);
      return Array.from({ length: 5 }, () => random());
    };
    expect(sequence(42)).toEqual(sequence(42));
    expect(sequence(42)).not.toEqual(sequence(43));
    expect(sequence(42).every((value) => value >= 0 && value < 1)).toBe(true);
  });

  it("metin tohumu kararlıdır ve Türkçe karakterleri ayırt eder", () => {
    expect(seedFromString("2026-11-27")).toBe(seedFromString("2026-11-27"));
    expect(seedFromString("KIŞ")).not.toBe(seedFromString("KİŞ"));
  });
});
