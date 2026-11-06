import { describe, expect, it } from "vitest";

import type { Attempt, GameSnapshot } from "./contracts";
import { createInitialSnapshot, createSeededRandom } from "./engine";
import { standardPuzzle } from "./fixtures";
import {
  bombFor,
  bombTotals,
  ladderTotals,
  legacyRiskPlays,
  legendAvailable,
  riskBonus,
  riskPot,
  riskTimeline,
  type RiskPlay,
} from "./specialModes";

const [renkler, meyveler, gezegenler, sehirler] = standardPuzzle.groups;
const ids = (group: typeof renkler) => group.words.map((word) => word.id) as Attempt["wordIds"];
const correct = (group: typeof renkler, n: number): Attempt => ({ id: `a${n}`, wordIds: ids(group), verdict: "correct" });
const wrong = (n: number, wordIds = [renkler.words[0].id, meyveler.words[0].id, gezegenler.words[0].id, sehirler.words[0].id]): Attempt =>
  ({ id: `a${n}`, wordIds: wordIds as Attempt["wordIds"], verdict: "wrong" });
const snap = (attempts: Attempt[], status: GameSnapshot["status"] = "playing"): GameSnapshot => ({
  ...createInitialSnapshot(standardPuzzle, { random: createSeededRandom(1) }),
  attempts,
  status,
  mistakesRemaining: 4 - attempts.filter((a) => a.verdict !== "correct").length,
});

describe("Risk", () => {
  it("duruşlar farklı kazanç ve kayıp getirir", () => {
    const attempts = [correct(renkler, 1), wrong(2), correct(meyveler, 3)];
    const safe: RiskPlay[] = [{ stance: "safe", tier: null }, { stance: "safe", tier: null }, { stance: "safe", tier: null }];
    const bold: RiskPlay[] = [{ stance: "bold", tier: null }, { stance: "bold", tier: null }, { stance: "bold", tier: null }];
    expect(riskPot(standardPuzzle, attempts, safe)).toBe(100 + 25 - 25 + 25);
    expect(riskPot(standardPuzzle, attempts, bold)).toBe(100 + 75 - 50 + 75);
  });

  it("Efsane zorluk rengini de doğru tahmin ederse +150, renk yanlışsa +50", () => {
    const attempts = [correct(renkler, 1), correct(meyveler, 2)];
    const hit = riskTimeline(standardPuzzle, attempts, [{ stance: "safe", tier: null }, { stance: "legend", tier: meyveler.difficulty }]);
    const miss = riskTimeline(standardPuzzle, attempts, [{ stance: "safe", tier: null }, { stance: "legend", tier: 4 }]);
    expect(hit[1]).toMatchObject({ delta: 150, tierHit: true });
    expect(miss[1]).toMatchObject({ delta: 50, tierHit: false });
  });

  it("Efsane yalnız önceki tahmin doğruysa açılır", () => {
    expect(legendAvailable([])).toBe(false);
    expect(legendAvailable([correct(renkler, 1)])).toBe(true);
    expect(legendAvailable([correct(renkler, 1), wrong(2)])).toBe(false);
  });

  it("pot sıfırın altına inmez; bonus başlangıcın üstüdür", () => {
    const pot = riskPot(standardPuzzle, [wrong(1), wrong(2)], [{ stance: "legend", tier: 1 }, { stance: "legend", tier: 1 }]);
    expect(pot).toBe(0);
    expect(riskBonus(pot)).toBe(0);
    expect(riskBonus(225)).toBe(125);
  });

  it("eski puan yatırma kaydı duruşlara çevrilir", () => {
    expect(legacyRiskPlays([10, 25, 50, 100]).map((p) => p.stance)).toEqual(["safe", "safe", "bold", "legend"]);
  });
});

describe("Çarpan Merdiveni", () => {
  it("çarpan 1×→2×→3×→4× yükselir ve 4×'te durur", () => {
    const totals = ladderTotals(snap([correct(renkler, 1), correct(meyveler, 2), correct(gezegenler, 3)]), [], null);
    expect(totals.pot).toBe(100 + 200 + 300);
    expect(totals.multiplier).toBe(4);
  });

  it("kasaya almak çarpanı sıfırlar ama yanlışa karşı korur", () => {
    const attempts = [correct(renkler, 1), correct(meyveler, 2), wrong(3)];
    expect(ladderTotals(snap(attempts), [2], null)).toMatchObject({ bank: 300, pot: 0, bonus: 100 });
    expect(ladderTotals(snap(attempts), [], null)).toMatchObject({ bank: 0, pot: 0, bonus: 0 });
  });

  it("kalkan bir yanlışta potu ve çarpanı korur", () => {
    const attempts = [correct(renkler, 1), correct(meyveler, 2), wrong(3), correct(gezegenler, 4)];
    const shielded = ladderTotals(snap(attempts), [], 3);
    expect(shielded.pot).toBe(100 + 200 + 300);
    expect(shielded.events.map((e) => e.kind)).toEqual(["climb", "climb", "shield", "climb"]);
    expect(ladderTotals(snap(attempts), [], null).pot).toBe(100);
  });

  it("kazanınca ortadaki pot kasaya girer", () => {
    const attempts = [correct(renkler, 1), correct(meyveler, 2), correct(gezegenler, 3), correct(sehirler, 4)];
    expect(ladderTotals(snap(attempts, "won"), [], null)).toMatchObject({ bank: 1000, bonus: 600 });
  });
});

describe("Bomba Kart", () => {
  const bomb = bombFor(standardPuzzle);
  const bombGroup = standardPuzzle.groups.find((g) => g.words.some((w) => w.id === bomb))!;
  const others = standardPuzzle.groups.filter((g) => g.id !== bombGroup.id);

  it("bombalı kart deterministiktir", () => {
    expect(bombFor(standardPuzzle)).toBe(bomb);
    expect(bombFor({ ...standardPuzzle, id: "baska" })).not.toBe(undefined);
  });

  it("erken etkisiz kılmak daha çok bonus verir", () => {
    const early = bombTotals(standardPuzzle, snap([correct(bombGroup, 1)]), bomb, null);
    const late = bombTotals(standardPuzzle, snap([correct(others[0]!, 1), correct(others[1]!, 2), correct(bombGroup, 3)]), bomb, null);
    expect(early).toMatchObject({ state: "defused", bonus: 100 + 50 * 3 });
    expect(late).toMatchObject({ state: "defused", bonus: 100 + 50 * 1 });
  });

  it("fitil biterse patlar ve bir ek hata yazar", () => {
    const attempts = [correct(others[0]!, 1), correct(others[1]!, 2), correct(others[2]!, 3)];
    expect(bombTotals(standardPuzzle, snap(attempts), bomb, null)).toMatchObject({ state: "exploded", extraMistakes: 1, remaining: 3, bonus: 0 });
  });

  it("soğutma fitile iki tur ekler", () => {
    const attempts = [correct(others[0]!, 1), correct(others[1]!, 2), correct(others[2]!, 3)];
    expect(bombTotals(standardPuzzle, snap(attempts), bomb, 1)).toMatchObject({ state: "armed", fuse: 2 });
    expect(bombTotals(standardPuzzle, snap(attempts), bomb, 0)).toMatchObject({ state: "armed", fuse: 2 });
  });

  it("bombalı yanlış tahmin bir ek hata yazar", () => {
    const withBomb = wrong(1, [bomb, ...others.map((g) => g.words[0]!.id)]);
    expect(bombTotals(standardPuzzle, snap([withBomb]), bomb, null)).toMatchObject({ extraMistakes: 1, remaining: 2 });
  });
});
