import { describe, expect, it } from "vitest";

import { tutorialPuzzle } from "@/features/game/fixtures";

import { evaluateTutorialSelection, tutorialWordOrder } from "./tutorialLogic";

describe("Q12 öğretici mantığı", () => {
  it("iki grubu karışık ve deterministik sırada gösterir", () => {
    const order = tutorialWordOrder(tutorialPuzzle);
    expect(order).toHaveLength(8);
    expect(new Set(order).size).toBe(8);
    expect(order.slice(0, 4)).not.toEqual(
      tutorialPuzzle.groups[0].words.map((word) => word.id),
    );
  });

  it("dört farklı kelime yoksa gönderimi eksik sayar", () => {
    expect(
      evaluateTutorialSelection(tutorialPuzzle, ["yaz", "kis"], []),
    ).toEqual({ kind: "incomplete" });

    expect(
      evaluateTutorialSelection(
        tutorialPuzzle,
        ["yaz", "yaz", "kis", "ilkbahar"],
        [],
      ),
    ).toEqual({ kind: "incomplete" });
  });

  it("tam doğru grubu bulur", () => {
    const selected = tutorialPuzzle.groups[0].words.map((word) => word.id);
    const result = evaluateTutorialSelection(tutorialPuzzle, selected, []);
    expect(result.kind).toBe("correct");
    if (result.kind === "correct") expect(result.group.id).toBe("mevsimler");
  });

  it("karışık dörtlüyü yanlış sayar ve çözülmüş grubu tekrar doğru kabul etmez", () => {
    expect(
      evaluateTutorialSelection(
        tutorialPuzzle,
        ["yaz", "kis", "kuzey", "guney"],
        [],
      ),
    ).toEqual({ kind: "wrong" });

    const solvedWords = tutorialPuzzle.groups[0].words.map((word) => word.id);
    expect(
      evaluateTutorialSelection(tutorialPuzzle, solvedWords, ["mevsimler"]),
    ).toEqual({ kind: "wrong" });
  });
});
