import { describe, expect, it } from "vitest";

import type { Cell } from "./board";
import type { EngineConfig } from "./config";
import { applyMove, createGame, type GameState } from "./game";
import { makePiece, type PieceSource, type ShapeId } from "./pieces";
import { parseState, replay, serializeState } from "./replay";
import type { Dictionary } from "./words";

const dict = (...words: string[]): Dictionary => {
  const set = new Set(words);
  return { has: (word) => set.has(word) };
};

/** Saf ve deterministik test kaynağı: parça kimliğine göre listeden sırayla verir. */
function queueSource(pieces: readonly (readonly [ShapeId, string])[]): PieceSource {
  return (rng, { id }) => {
    const [shape, letters] = pieces[(id - 1) % pieces.length]!;
    return { piece: makePiece(id, shape, [...letters]), rng: (rng + 1) >>> 0 };
  };
}

function withBoard(state: GameState, rows: readonly string[]): GameState {
  const board: Cell[][] = rows.map((row) => [...row].map((ch) => (ch === "." ? null : ch)));
  return { ...state, board };
}

function game(pieces: readonly (readonly [ShapeId, string])[], rows: readonly string[], config: Partial<EngineConfig> = {}) {
  const source = queueSource(pieces);
  const size = config.boardSize ?? 7;
  const state = withBoard(createGame({ seed: 1, config, source }), rows.length ? rows : Array(size).fill(".".repeat(size)));
  return { state, source };
}

const EMPTY7 = Array(7).fill(".......") as string[];

describe("yerleştirme", () => {
  it("tahta dışına ve dolu hücreye koymayı reddeder; durum değişmez", () => {
    const { state, source } = game([["h3", "KAL"]], ["X......", ...EMPTY7.slice(1)]);
    const before = serializeState(state);
    expect(applyMove(state, { slot: 0, row: 0, col: 5 }, dict(), source)).toEqual({ ok: false, reason: "out-of-bounds" });
    expect(applyMove(state, { slot: 0, row: 0, col: 0 }, dict(), source)).toEqual({ ok: false, reason: "occupied" });
    expect(applyMove(state, { slot: 9, row: 0, col: 0 }, dict(), source)).toEqual({ ok: false, reason: "bad-slot" });
    expect(serializeState(state)).toBe(before);
  });

  it("kullanılan yuva aynı hamlede yenilenir, diğerleri yerinde kalır", () => {
    const { state, source } = game([["single", "A"], ["single", "B"], ["single", "C"], ["single", "D"]], []);
    const outcome = applyMove(state, { slot: 1, row: 3, col: 3 }, dict(), source);
    if (!outcome.ok) throw new Error(outcome.reason);
    expect(outcome.state.tray.map((p) => p.id)).toEqual([1, 4, 3]);
    expect(outcome.state.board[3]![3]).toBe("B");
  });
});

describe("kelime bulma ve silme", () => {
  it("yatay kelime silinir, puan 10 × uzunluk²; yerçekimi yok", () => {
    const { state, source } = game([["single", "E"]], ["KAL....", "XYZ....", ...EMPTY7.slice(2)]);
    const outcome = applyMove(state, { slot: 0, row: 0, col: 3 }, dict("KALE"), source);
    if (!outcome.ok) throw new Error(outcome.reason);
    expect(outcome.result.words.map((w) => w.word)).toEqual(["KALE"]);
    expect(outcome.result.points).toBe(160);
    expect(outcome.state.board[0]!.slice(0, 4)).toEqual([null, null, null, null]);
    expect(outcome.state.board[1]!.slice(0, 3)).toEqual(["X", "Y", "Z"]);
  });

  it("dikey kelime yukarıdan aşağıya okunur", () => {
    const { state, source } = game([["single", "E"]], ["K......", "A......", "L......", ...EMPTY7.slice(3)]);
    const outcome = applyMove(state, { slot: 0, row: 3, col: 0 }, dict("KALE"), source);
    expect(outcome.ok && outcome.result.words.map((w) => [w.word, w.direction])).toEqual([["KALE", "vertical"]]);
  });

  it("V1: ters okuma yok (ELAK, KALE sayılmaz)", () => {
    const { state, source } = game([["single", "E"]], [".LAK...", ...EMPTY7.slice(1)]);
    const outcome = applyMove(state, { slot: 0, row: 0, col: 0 }, dict("KALE"), source);
    expect(outcome.ok && outcome.result.words).toEqual([]);
  });

  it("en az 4 harf: 3 harflik kelime silinmez", () => {
    const { state, source } = game([["single", "L"]], ["KA.....", ...EMPTY7.slice(1)]);
    const outcome = applyMove(state, { slot: 0, row: 0, col: 2 }, dict("KAL"), source);
    expect(outcome.ok && outcome.result.words).toEqual([]);
  });

  it("aynı dizide en uzun geçerli kelime kazanır (KALEM > KALE)", () => {
    const { state, source } = game([["single", "M"]], ["KALE...", ...EMPTY7.slice(1)]);
    const outcome = applyMove(state, { slot: 0, row: 0, col: 4 }, dict("KALE", "KALEM"), source);
    expect(outcome.ok && outcome.result.words.map((w) => w.word)).toEqual(["KALEM"]);
  });

  it("V2: aynı dizide çakışmayan iki kelime birlikte silinir", () => {
    const { state, source } = game([["h2", "EM"]], ["KAL..ASA", ...Array(7).fill("........")], { boardSize: 8 });
    const outcome = applyMove(state, { slot: 0, row: 0, col: 3 }, dict("KALE", "MASA"), source);
    if (!outcome.ok) throw new Error(outcome.reason);
    expect(outcome.result.words.map((w) => w.word)).toEqual(["KALE", "MASA"]);
    expect(outcome.result.points).toBe(Math.floor((160 + 160) * 1.5));
  });

  it("V2: eşit uzunlukta çakışan adaylardan başlangıcı önce olan kazanır", () => {
    const { state, source } = game([["single", "C"]], ["AB.DE..", ...EMPTY7.slice(1)]);
    const outcome = applyMove(state, { slot: 0, row: 0, col: 2 }, dict("ABCD", "BCDE"), source);
    expect(outcome.ok && outcome.result.words.map((w) => w.word)).toEqual(["ABCD"]);
    expect(outcome.ok && outcome.state.board[0]![4]).toBe("E");
  });

  it("kesişen kelimeler: ortak hücre bir kez silinir, iki kelime de puanlanır ve çarpan uygulanır", () => {
    // Dikeyde K-A-?-E ve yatayda M-A-S-? : (2,3)'e konan L hem KALE'yi hem MASL'yi tamamlar.
    const { state, source } = game([["single", "L"]], ["...K...", "...A...", "MAS....", "...E...", ...EMPTY7.slice(4)]);
    const outcome = applyMove(state, { slot: 0, row: 2, col: 3 }, dict("KALE", "MASL"), source);
    if (!outcome.ok) throw new Error(outcome.reason);
    expect(outcome.result.words.map((w) => w.word).sort()).toEqual(["KALE", "MASL"]);
    expect(outcome.result.cleared).toHaveLength(7);
    expect(outcome.result.points).toBe(Math.floor((160 + 160) * 1.5));
  });

  it("yeni hücre içermeyen eski kelime silinmez", () => {
    const { state, source } = game([["single", "Z"]], ["MASA...", ...EMPTY7.slice(1)]);
    const outcome = applyMove(state, { slot: 0, row: 5, col: 5 }, dict("MASA"), source);
    expect(outcome.ok && outcome.state.board[0]!.slice(0, 4)).toEqual(["M", "A", "S", "A"]);
  });
});

describe("oyun sonu", () => {
  it("hiçbir parça sığmazsa oyun biter ve hamle reddedilir", () => {
    const full = ["XXXXXXX", "XXXXXXX", "XXXXXXX", "XXXXXXX", "XXXXXXX", "XXXXXXX", "XXXXX.."];
    const { state, source } = game([["single", "A"], ["v2", "BC"], ["single", "D"]], full);
    const outcome = applyMove(state, { slot: 0, row: 6, col: 5 }, dict(), source);
    if (!outcome.ok) throw new Error(outcome.reason);
    // Kalan tek boş hücreye tek harflik parça sığar; oyun sürer.
    expect(outcome.state.over).toBe(false);
    const last = applyMove(outcome.state, { slot: 2, row: 6, col: 6 }, dict(), source);
    if (!last.ok) throw new Error(last.reason);
    expect(last.state.over).toBe(true);
    expect(applyMove(last.state, { slot: 0, row: 0, col: 0 }, dict(), source)).toEqual({ ok: false, reason: "game-over" });
  });
});

describe("determinizm, replay ve kayıt", () => {
  it("aynı tohum aynı tepsiyi, farklı tohum farklı tepsiyi verir", () => {
    const tray = (seed: number) => JSON.stringify(createGame({ seed }).tray);
    expect(tray(7)).toBe(tray(7));
    expect(tray(7)).not.toBe(tray(8));
  });

  it("replay aynı durumu üretir; sürüm farkı ve yasadışı hamle reddedilir", () => {
    let state = createGame({ seed: 99 });
    const moves = [];
    for (let i = 0; i < 5; i++) {
      const slot = 0;
      const target = (() => {
        for (let row = 0; row < 7; row++) for (let col = 0; col < 7; col++) {
          const outcome = applyMove(state, { slot, row, col }, dict());
          if (outcome.ok) return { move: { slot, row, col }, next: outcome.state };
        }
        throw new Error("hamle yok");
      })();
      moves.push(target.move);
      state = target.next;
    }
    const log = { version: state.version, seed: 99, config: state.config, moves };
    const replayed = replay(log, dict());
    expect(replayed.ok && serializeState(replayed.state)).toBe(serializeState(state));
    expect(replay({ ...log, version: "0.0.0" }, dict())).toEqual({ ok: false, reason: "version-mismatch" });
    expect(replay({ ...log, moves: [...moves, { slot: 0, row: 99, col: 0 }] }, dict())).toMatchObject({ ok: false, reason: "illegal-move", moveIndex: 5 });
  });

  it("kayıt geri yüklenir; bozuk ya da kurcalanmış kayıt reddedilir", () => {
    const state = createGame({ seed: 5 });
    const raw = serializeState(state);
    expect(parseState(raw)).toEqual(state);
    const tamper = (fn: (s: Record<string, unknown>) => void) => {
      const copy = JSON.parse(raw) as Record<string, unknown>;
      fn(copy);
      return parseState(JSON.stringify(copy));
    };
    expect(parseState("{bozuk")).toBeNull();
    expect(tamper((s) => { s.version = "0.0.1"; })).toBeNull();
    expect(tamper((s) => { s.score = -10; })).toBeNull();
    expect(tamper((s) => { (s.board as Cell[][])[0]![0] = "AB"; })).toBeNull();
    expect(tamper((s) => { (s.board as Cell[][]).pop(); })).toBeNull();
    expect(tamper((s) => { (s.tray as unknown[]).pop(); })).toBeNull();
    expect(tamper((s) => { ((s.tray as { cells: { dr: number }[] }[])[0]!.cells[0]!).dr = 5; })).toBeNull();
  });
});
