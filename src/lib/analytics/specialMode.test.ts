// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { standardPuzzle } from "@/features/game/fixtures";
import { createInitialSnapshot } from "@/features/game/engine";
import { ANALYTICS_STORAGE_KEY } from "./index";
import { specialFinish, specialProgress, specialStart } from "./specialMode";

beforeEach(() => localStorage.clear());
describe("special mode telemetry", () => {
  it("deduplicates starts and finishes, keeps modes separate and records effective bomb mistakes", () => {
    const snapshot = { ...createInitialSnapshot(standardPuzzle, { random: () => .5 }), attempts: [{ id:"a1", wordIds:standardPuzzle.groups[0].words.map(w => w.id) as [string,string,string,string], verdict:"wrong" as const }] };
    specialStart(standardPuzzle, "bomb", false); specialStart(standardPuzzle, "bomb", true);
    specialProgress(standardPuzzle, "bomb", snapshot, 2);
    specialFinish(standardPuzzle, "bomb", snapshot, 0, 0); specialFinish(standardPuzzle, "bomb", snapshot, 0, 0);
    specialStart(standardPuzzle, "risk", false);
    const events = JSON.parse(localStorage.getItem(ANALYTICS_STORAGE_KEY) || "[]");
    expect(events.map((item: { name:string }) => item.name)).toEqual(["game_start", "game_progress", "game_finish", "game_start"]);
    expect(events[2].properties).toMatchObject({ mode:"bomb", status:"lost", mistakesUsed:4, score:0 });
  });
});
