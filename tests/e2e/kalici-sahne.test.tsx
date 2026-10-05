import { act, cleanup, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GameBackdrop } from "@/components/game/GameBackdrop";
import { GameBoard } from "@/components/game/GameBoard";
import { GAME_OPENINGS } from "@/animations/openingScenes";
import { createUser, guess, puzzle, registerFlowHooks, RENKLER } from "./helpers";

registerFlowHooks();
describe("kalıcı oyun sahnesi", () => {
  it("23 sahnenin tümünü etkileşimsiz arka plan olarak çizer", () => {
    for (const scene of GAME_OPENINGS) {
      const { container } = render(<GameBackdrop scene={scene} />);
      const background = container.querySelector("[data-game-background]");
      expect(background?.getAttribute("data-game-background")).toBe(scene);
      expect(background?.hasAttribute("inert")).toBe(true);
      expect(background?.getAttribute("aria-hidden")).toBe("true");
      expect(container.querySelector("button, a, input")).toBeNull();
      cleanup();
    }
  });
  it("açılış bitince ve tahminden sonra aynı arka planı korur", async () => {
    const { container } = render(<GameBoard puzzle={{ ...puzzle, date: "2026-09-21" }} />);
    const background = container.querySelector("[data-game-background=sunrise]");
    expect(background).not.toBeNull();
    act(() => vi.advanceTimersByTime(3400));
    expect(screen.queryByRole("region", { name: "Oyun açılışı" })).toBeNull();
    const user = createUser();
    await guess(user, RENKLER);
    expect(container.querySelector("[data-game-background=sunrise]")).toBe(background);
    expect(screen.getByText("RENKLER")).toBeTruthy();
  });
});
