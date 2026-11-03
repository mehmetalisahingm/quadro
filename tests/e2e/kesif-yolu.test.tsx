import { act, cleanup, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JourneyStage } from "@/components/journey/JourneyStage";
import { JourneyMap } from "@/components/journey/JourneyMap";
import { loadJourneyPuzzle } from "@/lib/daily/journeyPuzzle";
import { createGameStore } from "@/features/game/state/gameStore";
import { journeyStorage, readJourneyProgress, retryJourneyStep } from "@/lib/persistence/journeyProgress";
import { createUser, enterGame, guess, registerFlowHooks } from "./helpers";
registerFlowHooks();
describe("Keşif Yolu gameplay", () => {
  it("opens step two only after winning step one and keeps progress on remount", async () => {
    const puzzle = (await loadJourneyPuzzle(1))!;
    render(<JourneyStage step={1} puzzle={puzzle} />);
    const user = createUser(); await enterGame(user);
    expect(screen.getByLabelText("Bu adımın keşif notu").textContent).toContain("meyveyi");
    expect(screen.queryByRole("link", { name: "Sonraki adımı keşfet →" })).toBeNull();
    for (const group of puzzle.groups) await guess(user, group.words.map(w => w.text));
    await act(async () => undefined);
    expect(screen.getByRole("link", { name: "Sonraki adımı keşfet →" }).getAttribute("href")).toBe("/journey/step?level=2");
    cleanup(); render(<JourneyStage step={1} puzzle={puzzle} />);
    expect(screen.getByRole("region", { name: "Adım tamamlandı" })).toBeTruthy();
    cleanup(); render(<JourneyMap />);
    expect(screen.getByRole("link", { name: /Adım 2 ·.*Oynanabilir/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Adım 1 ·.*3 yıldız/ })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Adım 3 ·/ })).toBeNull();
  });
  it("blocks a locked step reached by typing its URL", async () => {
    render(<JourneyStage step={30} puzzle={(await loadJourneyPuzzle(30))!} />);
    expect(screen.getByRole("heading", { name: "Bu adım henüz açılmadı." })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Grupla" })).toBeNull();
  });
  it("keeps visit progress when storage rejects writes and resets only the retried step", async () => {
    const set = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Blocked", "SecurityError"); });
    const remove = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => { throw new DOMException("Blocked", "SecurityError"); });
    try {
      for (const step of [1, 2]) {
        const puzzle = (await loadJourneyPuzzle(step))!;
        const store = createGameStore({ puzzle, storage: journeyStorage(puzzle.id) });
        store.hydrate();
        puzzle.groups.forEach(group => { group.words.forEach(word => store.toggleWord(word.id)); store.submitSelection(); });
      }
      expect(readJourneyProgress()).toMatchObject({ unlocked: 3, complete: 2 });
      retryJourneyStep(2);
      expect(readJourneyProgress()).toMatchObject({ unlocked: 2, complete: 1 });
      expect(readJourneyProgress().states[1]).toBe("new");
    } finally {
      retryJourneyStep(1); retryJourneyStep(2);
      set.mockRestore(); remove.mockRestore();
    }
  });
});
