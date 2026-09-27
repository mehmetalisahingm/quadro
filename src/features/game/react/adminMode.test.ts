import { describe, expect, it } from "vitest";

import { createSeededRandom } from "@/features/game/engine";
import { standardPuzzle } from "@/features/game/fixtures";

import { createEngineController } from "./engineController";

function submitWrongGuess(controller: ReturnType<typeof createEngineController>, index: 0 | 1 | 2 | 3) {
  for (const group of standardPuzzle.groups) {
    controller.toggleWord(group.words[index].id);
  }
  return controller.submitSelection();
}

describe("admin sınırsız hata modu", () => {
  it("yanlış tahminleri kaydeder ama hakkı tüketmez ve oyunu kaybettirmez", () => {
    const controller = createEngineController({
      puzzle: standardPuzzle,
      random: createSeededRandom(99),
      unlimitedMistakes: true,
    });

    for (const index of [0, 1, 2, 3] as const) {
      const result = submitWrongGuess(controller, index);
      expect(["wrong", "one-away"]).toContain(result.outcome.verdict);
      expect(controller.snapshot.status).toBe("playing");
      expect(controller.snapshot.mistakesRemaining).toBe(4);
      controller.clearSelection();
    }

    expect(controller.snapshot.attempts).toHaveLength(4);
  });

  it("admin modunda kaybedilmiş yerel kaydı yeniden oynanabilir hale getirir", () => {
    const normal = createEngineController({ puzzle: standardPuzzle, random: createSeededRandom(100) });
    for (const index of [0, 1, 2, 3] as const) {
      submitWrongGuess(normal, index);
      normal.clearSelection();
    }
    expect(normal.snapshot.status).toBe("lost");

    const admin = createEngineController({
      puzzle: standardPuzzle,
      random: createSeededRandom(101),
      unlimitedMistakes: true,
    });
    expect(admin.restore(normal.snapshot)).toBe(true);
    expect(admin.snapshot.status).toBe("playing");
    expect(admin.snapshot.mistakesRemaining).toBe(4);
  });
});
