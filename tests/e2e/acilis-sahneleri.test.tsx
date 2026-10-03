import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StoryOpening } from "@/components/game/StoryOpening";
import { BoardPrelude } from "@/components/game/BoardPrelude";
import { OPENING_DURATION, OPENING_SCENES } from "@/animations/openingScenes";
import { createUser, registerFlowHooks } from "./helpers";

registerFlowHooks();
const words = Array.from({ length: 16 }, (_, index) => `KELİME ${index + 1}`);

describe("opening lifecycle", () => {
  it("restored sculpture reveals the board before exit and releases scrolling", () => {
    const done = vi.fn(), reveal = vi.fn();
    const previous = document.body.style.overflow;
    const { unmount } = render(<BoardPrelude onComplete={done} onReveal={reveal} />);
    expect(document.body.style.overflow).toBe("hidden");
    expect(screen.getByRole("button", { name: "Oyuna geç" })).toBe(document.activeElement);
    act(() => vi.advanceTimersByTime(3000));
    expect(reveal).toHaveBeenCalledTimes(1);
    expect(done).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(600));
    expect(done).toHaveBeenCalledTimes(1);
    unmount();
    expect(document.body.style.overflow).toBe(previous);
  });

  it("restored sculpture can be skipped without a second completion", async () => {
    const done = vi.fn();
    render(<BoardPrelude onComplete={done} />);
    await createUser().click(screen.getByRole("button", { name: "Oyuna geç" }));
    act(() => vi.advanceTimersByTime(4000));
    expect(done).toHaveBeenCalledTimes(1);
  });

  it.each(OPENING_SCENES)("%s can be skipped without duplicate completion", async (scene) => {
    const done = vi.fn();
    render(<StoryOpening scene={scene} words={words} onComplete={done} />);
    await createUser().click(screen.getByRole("button", { name: "Oyuna geç" }));
    act(() => vi.advanceTimersByTime(OPENING_DURATION + 200));
    expect(done).toHaveBeenCalledTimes(1);
  });

  it.each(OPENING_SCENES)("%s completes even when animation events are unavailable", (scene) => {
    const done = vi.fn();
    render(<StoryOpening scene={scene} words={words} onComplete={done} />);
    act(() => vi.advanceTimersByTime(1000));
    expect(done).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(OPENING_DURATION));
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("bypasses the scene for reduced motion and restores page scrolling", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    const done = vi.fn();
    const previous = document.body.style.overflow;
    const { unmount } = render(<StoryOpening scene="metro" words={words} onComplete={done} />);
    act(() => vi.advanceTimersByTime(0));
    expect(done).toHaveBeenCalledTimes(1);
    unmount();
    expect(document.body.style.overflow).toBe(previous);
  });
});
