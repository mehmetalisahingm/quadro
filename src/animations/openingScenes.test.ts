import { describe, expect, it } from "vitest";
import { standardPuzzle } from "@/features/game/fixtures";
import { createGameStore } from "@/features/game/state/gameStore";
import { GAME_OPENINGS, OPENING_SCENES, gameOpeningFor, openingSceneFor, openingWords } from "./openingScenes";

describe("daily opening scenes", () => {
  it("keeps refreshes stable and avoids adjacent-day repeats across a month boundary", () => {
    const scenes = Array.from({ length: 40 }, (_, index) => {
      const day = new Date(Date.UTC(2026, 8, 25 + index)).toISOString().slice(0, 10);
      const scene = openingSceneFor(`q-${index}`, day);
      expect(openingSceneFor(`q-${index}`, day)).toBe(scene);
      return scene;
    });
    expect(new Set(scenes)).toEqual(new Set(OPENING_SCENES));
    scenes.slice(1).forEach((scene, index) => expect(scene).not.toBe(scenes[index]));
  });

  it("falls back deterministically when a day key is unavailable", () => {
    expect(openingSceneFor("q-abc", "invalid")).toBe(openingSceneFor("q-abc", "invalid"));
    expect(OPENING_SCENES).toContain(openingSceneFor("q-abc", "2026-02-31"));
  });

  it("rotates the gallery through all scenes across the month boundary", () => {
    const openings = Array.from({ length: GAME_OPENINGS.length }, (_, index) => gameOpeningFor(`q-${index + 1}`, new Date(Date.UTC(2026, 8, 20 + index)).toISOString().slice(0, 10)));
    expect(openings.slice(0, GAME_OPENINGS.length)).toEqual([...GAME_OPENINGS]);
    expect(openings).toHaveLength(23);
    expect(openings).toContain("record");
    expect(new Set(openings).size).toBe(GAME_OPENINGS.length);
  });

  it("uses exactly the fresh live board order without starting persistence", () => {
    const live = createGameStore({ puzzle: standardPuzzle });
    const lookup = new Map(standardPuzzle.groups.flatMap((group) => group.words.map((word) => [word.id, word.text])));
    expect(openingWords(standardPuzzle)).toEqual(live.getState().snapshot.remainingWordOrder.map((id) => lookup.get(id)));
    expect(new Set(openingWords(standardPuzzle)).size).toBe(16);
    expect(live.getState().restore.status).toBe("pending");
  });
});
