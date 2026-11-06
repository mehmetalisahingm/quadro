import { describe, expect, it } from "vitest";
import { standardPuzzle } from "@/features/game/fixtures/puzzles";
import { clearSelection, createInitialSnapshot, submitSelection, toggleWord } from "@/features/game/engine";
import { verifyFinishedSnapshot } from "./verify";

function completePuzzle() {
  let state = createInitialSnapshot(standardPuzzle, { random: () => 0.5 });
  for (const group of standardPuzzle.groups) {
    for (const word of group.words) state = toggleWord(standardPuzzle, state, word.id);
    state = submitSelection(standardPuzzle, state).snapshot;
  }
  return state;
}

describe("sunucu oyun sonucu replay koruması", () => {
  it("gerçekten tamamlanan kazanılmış oyunu kabul eder", () => {
    const run = completePuzzle();
    expect(run.status).toBe("won");
    expect(verifyFinishedSnapshot(standardPuzzle, run)).toEqual({
      result: "won", attemptCount: 4, mistakesUsed: 0, activeSeconds: 0,
    });
  });

  it("oyun durumu ve hata sayısı sahte değiştirilemez", () => {
    const run = completePuzzle();
    expect(verifyFinishedSnapshot(standardPuzzle, { ...run, status: "lost" })).toBeNull();
    expect(verifyFinishedSnapshot(standardPuzzle, { ...run, mistakesRemaining: 0 })).toBeNull();
    expect(verifyFinishedSnapshot(standardPuzzle, { ...run, puzzleId: "another" })).toBeNull();
  });

  it("tahmin sonuçları, sıra ve kart kimlikleri doğrulanır", () => {
    const run = completePuzzle();
    const attempts = run.attempts.map(a => ({ ...a, wordIds: [...a.wordIds] }));
    attempts[0]!.verdict = "wrong";
    expect(verifyFinishedSnapshot(standardPuzzle, { ...run, attempts })).toBeNull();
    const unknown = run.attempts.map(a => ({ ...a, wordIds: [...a.wordIds] }));
    unknown[0]!.wordIds[0] = "fake";
    expect(verifyFinishedSnapshot(standardPuzzle, { ...run, attempts: unknown })).toBeNull();
  });

  it("oynanmamış veya bitmemiş oturum kabul edilmez", () => {
    const run = completePuzzle();
    expect(verifyFinishedSnapshot(standardPuzzle, { ...run, attempts: [] })).toBeNull();
    expect(verifyFinishedSnapshot(standardPuzzle, { ...run, activeSeconds: -1 })).toBeNull();
  });

  it("yanlış tahminden sonra seçim değiştirip kazanılan oyunu kabul eder", () => {
    let run = createInitialSnapshot(standardPuzzle, { random: () => 0.5 });
    for (const group of standardPuzzle.groups) run = toggleWord(standardPuzzle, run, group.words[0].id);
    run = submitSelection(standardPuzzle, run).snapshot;
    run = clearSelection(run);
    for (const group of standardPuzzle.groups) {
      for (const word of group.words) run = toggleWord(standardPuzzle, run, word.id);
      run = submitSelection(standardPuzzle, run).snapshot;
    }
    expect(verifyFinishedSnapshot(standardPuzzle, run)).toMatchObject({ result: "won", attemptCount: 5, mistakesUsed: 1 });
  });
});
