import { describe, expect, it } from "vitest";
import { CARD_INTROS, INTRO_DURATION, cardIntroMotion, selectCardIntro } from "./cardIntros";

describe("daily card intros", () => {
  it("covers the entire pool, stays stable and never repeats on adjacent publication days", () => {
    const choices = Array.from({ length: 60 }, (_, i) => {
      const day = new Date(Date.UTC(2026, 8, 20 + i)).toISOString().slice(0, 10);
      const choice = selectCardIntro(`q-${i}`, day);
      expect(selectCardIntro(`q-${i}`, day)).toBe(choice);
      return choice;
    });
    expect(new Set(choices).size).toBe(6);
    choices.slice(1).forEach((choice, i) => expect(choice).not.toBe(choices[i]));
    expect(selectCardIntro("q-alpha")).toBe(selectCardIntro("q-alpha"));
    expect(CARD_INTROS).toContain(selectCardIntro("q-alpha", "invalid"));
  });

  it.each(CARD_INTROS)("%s lands every card on its actual target within 3 seconds", (variant) => {
    for (const width of [320, 390, 1440]) {
      for (let index = 0; index < 16; index++) {
        const target = { left: 20 + index % 4 * 70, top: 220 + Math.floor(index / 4) * 80, width: 64, height: 72 };
        const motion = cardIntroMotion(variant, index, { width, height: 844, target });
        expect(INTRO_DURATION + motion.delay).toBeLessThanOrEqual(3000);
        expect(motion.keyframes.at(-1)?.transform).toBe(`translate3d(${target.left}px, ${target.top}px, 0) rotate(0deg) scale(1)`);
        for (const frame of motion.keyframes) expect(frame.transform).not.toMatch(/NaN|Infinity/);
        // The full-screen staging grid fits even at the narrowest supported viewport.
        const staging = motion.keyframes[3]?.transform as string;
        const x = Number(staging.match(/translate3d\(([-.\d]+)px/)?.[1]);
        const scale = Number(staging.match(/scale\(([-.\d]+)\)/)?.[1]);
        expect(x + target.width * (1 - scale) / 2).toBeGreaterThanOrEqual(0);
        expect(x + target.width * (1 + scale) / 2).toBeLessThanOrEqual(width);
      }
    }
  });

  it("provides six distinct trajectories for the same card and board", () => {
    const geometry = { width: 1440, height: 900, target: { left: 400, top: 250, width: 140, height: 90 } };
    const trajectories = CARD_INTROS.map((variant) => JSON.stringify(cardIntroMotion(variant, 5, geometry).keyframes));
    expect(new Set(trajectories).size).toBe(6);
  });
});
