import { describe, expect, it } from "vitest";

import { createSampleScenario, standardPuzzle } from "@/features/game/fixtures";

import { buildShareText } from "./ShareCard";

describe("buildShareText", () => {
  it("her geçerli tahmin için bir emoji satırı üretir ve cevap metni sızdırmaz", () => {
    const { controller } = createSampleScenario("won");
    const { snapshot } = controller;
    const text = buildShareText(standardPuzzle, snapshot);
    const lines = text.split("\n");

    expect(lines).toHaveLength(snapshot.attempts.length + 1);
    expect(lines[0]).toBe(`Quadro ${standardPuzzle.date} 4/4`);
    for (const row of lines.slice(1)) expect(row).toMatch(/^[🟨🟩🟦🟪]{4}$/u);

    for (const group of standardPuzzle.groups) {
      expect(text).not.toContain(group.title);
      for (const word of group.words) expect(text).not.toContain(word.text);
    }
  });

  it("kaybedilen oyunda yalnız attempts geçmişini paylaşır", () => {
    const { controller } = createSampleScenario("lost");
    const { snapshot } = controller;
    const lines = buildShareText(standardPuzzle, snapshot).split("\n");

    expect(lines).toHaveLength(snapshot.attempts.length + 1);
    expect(lines[0]).toBe(`Quadro ${standardPuzzle.date} 1/4`);
  });
});
