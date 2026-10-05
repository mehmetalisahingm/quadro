import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { loadModePuzzle } from "./modePuzzle";
import { TRACKS, TRACK_LEVEL_COUNT } from "@/features/game/tracks";
import { parseDailyPuzzleFile } from "@/features/game/validator";

const signature = (words: { text: string }[]) => words.map(w => w.text.toLocaleUpperCase("tr-TR")).sort().join("|");
describe("separate difficulty content", () => {
  it("validates 18 different boards, no repeated groups, and matching blind boards", async () => {
    const boards = new Set<string>();
    const groups = new Set<string>();
    for (const filename of readdirSync("src/content/puzzles")) {
      const old = JSON.parse(readFileSync(`src/content/puzzles/${filename}`, "utf8"));
      boards.add(signature(old.groups.flatMap((g: {words: {text:string}[]}) => g.words)));
      for (const group of old.groups) groups.add(signature(group.words));
    }
    for (const mode of TRACKS) for (let level = 1; level <= TRACK_LEVEL_COUNT; level++) {
      const raw = JSON.parse(readFileSync(`src/content/modes/${mode.id}-${level}.json`, "utf8"));
      const parsed = parseDailyPuzzleFile(raw);
      expect(parsed.ok, `${mode.id}-${level}: ${JSON.stringify(parsed.issues)}`).toBe(true);
      const puzzle = await loadModePuzzle(mode.id, level);
      expect(puzzle).not.toBeNull();
      const words = puzzle!.groups.flatMap(g => g.words);
      expect(new Set(words.map(w => w.text)).size).toBe(16);
      expect(boards.has(signature(words)), `${mode.id}-${level} duplicate board`).toBe(false);
      boards.add(signature(words));
      for (const group of puzzle!.groups) {
        expect(groups.has(signature(group.words)), `${mode.id}-${level}: duplicate ${group.title}`).toBe(false);
        groups.add(signature(group.words));
      }
      const blind = JSON.parse(readFileSync(`src/content/editorial/modes/blind/${mode.id}-${level}.json`, "utf8"));
      expect(blind.puzzleId).toBe(puzzle!.id);
      expect(blind.words.map((w:{id:string;text:string}) => `${w.id}:${w.text}`).sort()).toEqual(words.map(w=>`${w.id}:${w.text}`).sort());
    }
  });
  it("rejects invalid chapter numbers and path traversal", async () => {
    expect(await loadModePuzzle("easy", 0)).toBeNull();
    expect(await loadModePuzzle("easy", 7)).toBeNull();
    expect(await loadModePuzzle("hard", 1.5)).toBeNull();
    // @ts-expect-error untrusted route input
    expect(await loadModePuzzle("../puzzles", 1)).toBeNull();
  });
});
