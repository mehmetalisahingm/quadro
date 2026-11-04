import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { loadJourneyPuzzle } from "./journeyPuzzle";
import { journeyDay, journeyDifficulty, journeyId, journeyStep, JOURNEY_LENGTH, JOURNEY_LESSONS } from "@/features/game/journey";
const signature = (groups: { words: { text: string }[] }[]) => groups.flatMap(g => g.words.map(w => w.text)).sort().join("|");
describe("30-step learning campaign", () => {
  it("validates 30 distinct boards, lessons, stable IDs and matching blind boards", async () => {
    const seen = new Set<string>();
    for (const dir of ["src/content/puzzles", "src/content/modes"]) for (const name of readdirSync(dir).filter(n => n.endsWith(".json"))) {
      const existing = JSON.parse(readFileSync(`${dir}/${name}`, "utf8"));
      if (existing.groups) seen.add(signature(existing.groups));
    }
    for (let step = 1; step <= JOURNEY_LENGTH; step++) {
      const puzzle = await loadJourneyPuzzle(step);
      expect(puzzle, `invalid chapter ${step}`).not.toBeNull();
      expect(puzzle!.id).toBe(journeyId(step));
      expect(puzzle!.date).toBe(journeyDay(step));
      expect(journeyStep(puzzle!.id)).toBe(step);
      const words = puzzle!.groups.flatMap(g => g.words);
      expect(new Set(words.map(w => w.text)).size).toBe(16);
      expect(seen.has(signature(puzzle!.groups)), `duplicate board ${step}`).toBe(false);
      seen.add(signature(puzzle!.groups));
      expect(JOURNEY_LESSONS[step - 1]!.length).toBeGreaterThan(30);
      const blind = JSON.parse(readFileSync(`src/content/editorial/journey/blind/${step}.json`, "utf8"));
      expect(blind.puzzleId).toBe(puzzle!.id);
      expect(blind.words.map((w:{id:string;text:string}) => `${w.id}:${w.text}`).sort()).toEqual(words.map(w => `${w.id}:${w.text}`).sort());
    }
    expect([1, 8, 9, 16, 17, 24, 25, 30].map(journeyDifficulty)).toEqual(["easy", "easy", "medium", "medium", "hard", "hard", "ultra", "ultra"]);
  });
  it("rejects invalid steps and foreign IDs", async () => {
    for (const step of [0, 201, -1, 1.5, NaN]) expect(await loadJourneyPuzzle(step)).toBeNull();
    expect(journeyStep("track-easy-001")).toBeNull();
    expect(journeyStep("journey-201")).toBeNull();
  });
});
