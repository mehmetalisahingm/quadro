import { describe, expect, it } from "vitest";
import { standardPuzzle } from "@/features/game/fixtures";
import { clearSelection, createInitialSnapshot, submitSelection, toggleWord } from "@/features/game/engine";
import type { GameSnapshot } from "@/features/game/contracts";
import { verifySpecialFinishedSnapshot } from "./verifySpecial";
const initial = () => createInitialSnapshot(standardPuzzle, { random: () => .5 });
function guess(state: GameSnapshot, words: string[]) { state = clearSelection(state); for (const word of words) state = toggleWord(standardPuzzle, state, word); return submitSelection(standardPuzzle, state).snapshot; }
describe("server special result verification", () => {
  it("verifies a completed ladder game against the board", () => {
    let state = initial();
    for (const group of standardPuzzle.groups) state = guess(state, group.words.map(word => word.id));
    expect(verifySpecialFinishedSnapshot(standardPuzzle, state, { mode: "ladder" })).toMatchObject({ result: "won", attemptCount: 4 });
    expect(verifySpecialFinishedSnapshot(standardPuzzle, { ...state, solvedGroupIds: [] }, { mode:"ladder" })).toBeNull();
  });
  it("recognizes risk bankruptcy and rejects a wager greater than balance", () => {
    const state = guess(initial(), standardPuzzle.groups.map(group => group.words[0].id));
    expect(state.status).toBe("playing");
    expect(verifySpecialFinishedSnapshot(standardPuzzle, state, { mode:"risk", wagers:[100] })).toMatchObject({ result:"lost", attemptCount:1 });
    expect(verifySpecialFinishedSnapshot(standardPuzzle, state, { mode:"risk", wagers:[101] })).toBeNull();
    expect(verifySpecialFinishedSnapshot(standardPuzzle, state, { mode:"risk", wagers:[10] })).toBeNull();
  });
  it("recognizes bomb penalty endings and rejects an invalid bomb", () => {
    const g = standardPuzzle.groups; const bombId = g[0].words[0].id;
    let state = guess(initial(), [bombId, g[1].words[0].id, g[2].words[0].id, g[3].words[0].id]);
    state = guess(state, [bombId, g[1].words[1].id, g[2].words[1].id, g[3].words[1].id]);
    expect(state.status).toBe("playing");
    expect(verifySpecialFinishedSnapshot(standardPuzzle, state, { mode:"bomb", bombId })).toMatchObject({ result:"lost", mistakesUsed:4 });
    expect(verifySpecialFinishedSnapshot(standardPuzzle, state, { mode:"bomb", bombId:"not-a-card" })).toBeNull();
  });
});
