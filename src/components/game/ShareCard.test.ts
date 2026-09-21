import { describe, expect, it } from "vitest";

import type { GameSnapshot } from "@/features/game/contracts";
import { createSampleScenario, standardPuzzle } from "@/features/game/fixtures";

import { formatDuration, getResultStats } from "./presentation";
import { buildShareText } from "./ShareCard";

/** Paylaşım metninin başlık satırı. */
function header(snapshot: GameSnapshot): string {
  const [first = ""] = buildShareText(standardPuzzle, snapshot).split("\n");
  return first;
}

/** Başlık satırındaki süre parçası ("Quadro … 4/4 · 2:18" → "2:18"). */
function sharedDuration(snapshot: GameSnapshot): string {
  const [, duration = ""] = header(snapshot).split(" · ");
  return duration;
}

describe("buildShareText", () => {
  it("her geçerli tahmin için bir emoji satırı üretir ve cevap metni sızdırmaz", () => {
    const { controller } = createSampleScenario("won");
    const { snapshot } = controller;
    const text = buildShareText(standardPuzzle, snapshot);
    const lines = text.split("\n");

    expect(lines).toHaveLength(snapshot.attempts.length + 1);
    expect(lines[0]).toBe(
      `Quadro ${standardPuzzle.date} 4/4 · ${formatDuration(snapshot.activeSeconds)}`,
    );
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
    expect(lines[0]).toBe(
      `Quadro ${standardPuzzle.date} 1/4 · ${formatDuration(snapshot.activeSeconds)}`,
    );
  });
});

describe("buildShareText · süre", () => {
  it("başlık satırı beklenen biçimi taşır", () => {
    const { controller } = createSampleScenario("won");
    const snapshot: GameSnapshot = { ...controller.snapshot, activeSeconds: 138 };

    expect(header(snapshot)).toBe(`Quadro ${standardPuzzle.date} 4/4 · 2:18`);
  });

  it("süreyi doğrudan snapshot.activeSeconds'tan alır", () => {
    const { controller } = createSampleScenario("won");
    const beklenen: ReadonlyArray<readonly [number, string]> = [
      [0, "0:00"],
      [9, "0:09"],
      [78, "1:18"],
      [138, "2:18"],
      [599, "9:59"],
      [3_600, "60:00"],
      [86_399, "1439:59"],
    ];

    for (const [activeSeconds, metin] of beklenen) {
      const snapshot: GameSnapshot = { ...controller.snapshot, activeSeconds };
      expect(sharedDuration(snapshot)).toBe(metin);
    }
  });

  it("sonuç ekranındaki süre ile paylaşımdaki süre birebir aynıdır", () => {
    // İkisi de aynı `formatDuration`dan (presentation.ts) geçer; ayrı bir
    // biçimlendirme ya da ikinci bir sayaç yoktur.
    const { controller } = createSampleScenario("won");

    for (const activeSeconds of [0, 7, 59, 60, 78, 138, 611, 4_000]) {
      const snapshot: GameSnapshot = { ...controller.snapshot, activeSeconds };

      expect(sharedDuration(snapshot)).toBe(getResultStats(snapshot).duration);
    }
  });

  it("gerçek senaryoların süresinde de iki gösterim ayrışmaz", () => {
    for (const durum of ["won", "lost"] as const) {
      const { snapshot } = createSampleScenario(durum).controller;

      expect(sharedDuration(snapshot)).toBe(getResultStats(snapshot).duration);
    }
  });

  it("süre satırı cevap sızdırmaz ve emoji ızgarasını bozmaz", () => {
    const { controller } = createSampleScenario("won");
    const snapshot: GameSnapshot = { ...controller.snapshot, activeSeconds: 138 };
    const lines = buildShareText(standardPuzzle, snapshot).split("\n");

    // Süre yalnız başlık satırındadır; emoji satırları olduğu gibi kalır.
    expect(lines.slice(1)).toEqual(
      snapshot.attempts.map(() => expect.stringMatching(/^[🟨🟩🟦🟪]{4}$/u)),
    );
    for (const group of standardPuzzle.groups) {
      expect(lines.join("\n")).not.toContain(group.title);
      for (const word of group.words) expect(lines.join("\n")).not.toContain(word.text);
    }
  });
});
