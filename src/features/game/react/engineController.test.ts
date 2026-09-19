import { describe, expect, it, vi } from "vitest";

import type { GameSnapshot, WordId } from "@/features/game/contracts";
import { createSeededRandom } from "@/features/game/engine";
import { standardPuzzle } from "@/features/game/fixtures";

import { createEngineController } from "./engineController";

function select(controller: ReturnType<typeof createEngineController>, wordIds: readonly WordId[]) {
  for (const wordId of wordIds) controller.toggleWord(wordId);
}

describe("Q16 gerçek motor controller entegrasyonu", () => {
  it("dört doğru grubu gerçek motorla çözer ve son correct sonucunda won olur", () => {
    const controller = createEngineController({
      puzzle: standardPuzzle,
      random: createSeededRandom(16),
    });

    for (const [index, group] of standardPuzzle.groups.entries()) {
      select(controller, group.words.map((word) => word.id));
      const result = controller.submitSelection();

      expect(result.outcome.verdict).toBe("correct");
      expect(result.snapshot).toBe(controller.snapshot);
      expect(controller.snapshot.solvedGroupIds).toContain(group.id);
      expect(controller.snapshot.status).toBe(
        index === standardPuzzle.groups.length - 1 ? "won" : "playing",
      );
    }

    expect(controller.snapshot.solvedGroupIds).toHaveLength(4);
    expect(controller.snapshot.remainingWordOrder).toHaveLength(0);
    expect(controller.snapshot.mistakesRemaining).toBe(4);
  });

  it("yanlış, tekrar ve dördüncü hata akışını gerçek motor üzerinden lost durumuna taşır", () => {
    const controller = createEngineController({
      puzzle: standardPuzzle,
      random: createSeededRandom(17),
    });

    const wrongGuess = (wordIndex: 0 | 1 | 2 | 3) =>
      standardPuzzle.groups.map((group) => group.words[wordIndex].id);

    select(controller, wrongGuess(0));
    const first = controller.submitSelection();
    expect(first.outcome.verdict).toBe("wrong");
    expect(controller.snapshot.mistakesRemaining).toBe(3);

    const repeated = controller.submitSelection();
    expect(repeated.outcome.verdict).toBe("repeated");
    expect(repeated.snapshot).toBe(controller.snapshot);
    expect(controller.snapshot.mistakesRemaining).toBe(3);
    expect(controller.snapshot.attempts).toHaveLength(1);

    for (const index of [1, 2, 3] as const) {
      controller.clearSelection();
      select(controller, wrongGuess(index));
      controller.submitSelection();
    }

    expect(controller.snapshot.status).toBe("lost");
    expect(controller.snapshot.mistakesRemaining).toBe(0);
    expect(controller.snapshot.attempts).toHaveLength(4);
    expect(controller.snapshot.solvedGroupIds).toHaveLength(0);

    const endedSnapshot = controller.snapshot;
    const ended = controller.submitSelection();
    expect(ended.outcome).toEqual({ verdict: "invalid", reason: "game-ended" });
    expect(ended.snapshot).toBe(endedSnapshot);
  });

  it("yalnız gerçek durum değişikliğinde aboneleri bilgilendirir", () => {
    const controller = createEngineController({
      puzzle: standardPuzzle,
      random: createSeededRandom(18),
    });
    const listener = vi.fn();
    const unsubscribe = controller.subscribe(listener);

    const firstWord = controller.snapshot.remainingWordOrder[0];
    expect(firstWord).toBeDefined();
    if (!firstWord) return;

    controller.toggleWord(firstWord);
    expect(listener).toHaveBeenCalledTimes(1);

    controller.submitSelection();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    controller.clearSelection();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("Q20 kaydedilmiş durumun uygulanması", () => {
  it("kaydedilmiş durumu uygular ve aboneleri bilgilendirir", () => {
    const controller = createEngineController({
      puzzle: standardPuzzle,
      random: createSeededRandom(20),
    });
    const listener = vi.fn();
    controller.subscribe(listener);

    const [ilkGrup] = standardPuzzle.groups;
    const kayit: GameSnapshot = {
      ...controller.snapshot,
      selectedWordIds: ilkGrup.words.slice(0, 2).map((word) => word.id),
      mistakesRemaining: 2,
    };

    expect(controller.restore(kayit)).toBe(true);
    expect(controller.snapshot).toBe(kayit);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("başka bir bulmacanın durumunu uygulamaz", () => {
    const controller = createEngineController({
      puzzle: standardPuzzle,
      random: createSeededRandom(21),
    });
    const tazeDurum = controller.snapshot;

    expect(controller.restore({ ...tazeDurum, puzzleId: "ornek-999" })).toBe(false);
    expect(controller.restore({ ...tazeDurum, puzzleRevision: 99 })).toBe(false);
    expect(controller.snapshot).toBe(tazeDurum);
  });
});
