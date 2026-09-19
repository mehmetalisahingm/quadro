/**
 * Kaydın motora bağlanmasının testleri (Q20).
 *
 * React'siz taraf: kaydın okunması motora hangi başlangıç durumunu verir ve
 * reddedilen kayıt nasıl raporlanır.
 */

import { describe, expect, it } from "vitest";

import type { GameSnapshot } from "@/features/game/contracts";
import { createInitialSnapshot, createSeededRandom, submitSelection } from "@/features/game/engine";
import { selectOnly } from "@/features/game/engine/testHelpers";
import { standardPuzzle } from "@/features/game/fixtures";
import { createMemoryStorage, saveSnapshot, snapshotStorageKey } from "@/lib/persistence";

import { readPersistedGame, writePersistedGame } from "./persistentGame";

const puzzle = standardPuzzle;

/** Bir grubu çözmüş oyun. */
function playedGame(): GameSnapshot {
  const fresh = createInitialSnapshot(puzzle, { random: createSeededRandom(11) });
  const wordIds = puzzle.groups[0].words.map((word) => word.id);
  return submitSelection(puzzle, selectOnly(puzzle, fresh, wordIds)).snapshot;
}

describe("kaydın motora bağlanması", () => {
  it("kayıt yoksa taze oyun açılır", () => {
    const storage = createMemoryStorage();

    expect(readPersistedGame({ puzzle, storage })).toEqual({
      snapshot: undefined,
      restore: { status: "fresh" },
    });
  });

  it("kayıt varsa motor o durumdan başlar", () => {
    const storage = createMemoryStorage();
    const oynanan = playedGame();
    writePersistedGame(oynanan, storage);

    expect(readPersistedGame({ puzzle, storage })).toEqual({
      snapshot: oynanan,
      restore: { status: "restored" },
    });
  });

  it("uygulanamayan kayıt gerekçesiyle düşer, oyun taze başlar", () => {
    const storage = createMemoryStorage({ [snapshotStorageKey(puzzle.date)]: "{bozuk" });

    expect(readPersistedGame({ puzzle, storage })).toEqual({
      snapshot: undefined,
      restore: { status: "discarded", reason: "malformed-json" },
    });
  });

  it("dünün kaydı bugünkü motora verilmez", () => {
    const storage = createMemoryStorage();
    const dun: GameSnapshot = { ...playedGame(), dayKey: "2026-09-19" };
    // Dünün kaydı bugünün anahtarına yazılmış olsa bile uygulanmaz.
    saveSnapshot(dun, { storage });
    storage.setItem(
      snapshotStorageKey(puzzle.date),
      storage.getItem(snapshotStorageKey("2026-09-19")) ?? "",
    );

    expect(readPersistedGame({ puzzle, storage })).toEqual({
      snapshot: undefined,
      restore: { status: "discarded", reason: "day-mismatch" },
    });
  });

  it("yazma kuralları kalıcılık katmanından gelir: bitmiş oyun korunur", () => {
    const storage = createMemoryStorage();
    const kazanilan: GameSnapshot = ([0, 1, 2, 3] as const).reduce<GameSnapshot>(
      (state, index) =>
        submitSelection(
          puzzle,
          selectOnly(
            puzzle,
            state,
            puzzle.groups[index].words.map((word) => word.id),
          ),
        ).snapshot,
      createInitialSnapshot(puzzle, { random: createSeededRandom(11) }),
    );

    writePersistedGame(kazanilan, storage);
    writePersistedGame(createInitialSnapshot(puzzle, { random: createSeededRandom(11) }), storage);

    expect(readPersistedGame({ puzzle, storage })).toEqual({
      snapshot: kazanilan,
      restore: { status: "restored" },
    });
  });
});
