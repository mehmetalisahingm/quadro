/**
 * Özel mod kuralları (#173). Saf fonksiyonlardır: motorun tahmin geçmişinden ve oyuncunun
 * kararlarından her turun etkisini, bonusu ve bitişi hesaplar. Sonuç rastgelelikle
 * belirlenmez; aynı kararlar aynı sonucu verir.
 *
 * Bonuslar temel skordan (400 − 100 × yanlış tahmin) ayrıdır ve enerji vermez (#172).
 * Tasarım: docs/SPECIAL_MODES_DESIGN.md.
 */

import type { Attempt, GameSnapshot, Puzzle, PuzzleGroup } from "./contracts";

const correctGroup = (puzzle: Puzzle, attempt: Attempt): PuzzleGroup | undefined =>
  attempt.verdict === "correct"
    ? puzzle.groups.find((group) => attempt.wordIds.every((id) => group.words.some((word) => word.id === id)))
    : undefined;

// ---------------------------------------------------------------------------
// Risk: güven ve karar
// ---------------------------------------------------------------------------

export type RiskStance = "safe" | "bold" | "legend";
export type Tier = 1 | 2 | 3 | 4;
/** Her kabul edilen tahmin için oyuncunun kararı; tahmin geçmişiyle aynı sıradadır. */
export type RiskPlay = { stance: RiskStance; tier: Tier | null };

export const RISK_START = 100;
export const RISK_STAKES = {
  safe: { label: "Güvenli", win: 25, lose: 25 },
  bold: { label: "Cesur", win: 75, lose: 50 },
  /** Efsane: grup doğru ve zorluk rengi de doğruysa +150, renk yanlışsa +50. */
  legend: { label: "Efsane", win: 150, lose: 100, colourMiss: 50 },
} as const;

export type RiskStep = { turn: number; stance: RiskStance; tier: Tier | null; verdict: Attempt["verdict"]; tierHit: boolean | null; delta: number; pot: number };

export function riskTimeline(puzzle: Puzzle, attempts: readonly Attempt[], plays: readonly RiskPlay[]): RiskStep[] {
  let pot = RISK_START;
  return attempts.map((attempt, index) => {
    const play = plays[index] ?? { stance: "safe", tier: null };
    const stake = RISK_STAKES[play.stance];
    let delta: number;
    let tierHit: boolean | null = null;
    if (attempt.verdict === "correct") {
      if (play.stance === "legend") {
        tierHit = correctGroup(puzzle, attempt)?.difficulty === play.tier;
        delta = tierHit ? RISK_STAKES.legend.win : RISK_STAKES.legend.colourMiss;
      } else {
        delta = stake.win;
      }
    } else {
      delta = -Math.min(pot, stake.lose);
    }
    pot += delta;
    return { turn: index + 1, stance: play.stance, tier: play.tier, verdict: attempt.verdict, tierHit, delta, pot };
  });
}

/** Efsane yalnız önceki tahmin doğruysa seçilebilir: her tur bir sonrakini etkiler. */
export function legendAvailable(attempts: readonly Attempt[]): boolean {
  return attempts.at(-1)?.verdict === "correct";
}

export function riskPot(puzzle: Puzzle, attempts: readonly Attempt[], plays: readonly RiskPlay[]): number {
  return riskTimeline(puzzle, attempts, plays).at(-1)?.pot ?? RISK_START;
}

export const riskBonus = (pot: number): number => Math.max(0, pot - RISK_START);

/** Eski (v1) puan yatırma kaydını yeni kararlara çevirir; tahmin geçmişi korunur. */
export function legacyRiskPlays(wagers: readonly number[]): RiskPlay[] {
  return wagers.map((amount) => ({ stance: amount <= 25 ? "safe" : amount <= 75 ? "bold" : "legend", tier: null }));
}

// ---------------------------------------------------------------------------
// Çarpan Merdiveni: yükselme ve kasa
// ---------------------------------------------------------------------------

export const LADDER_MAX_MULTIPLIER = 4;
export const LADDER_STEP = 100;

export type LadderEvent =
  | { turn: number; kind: "climb"; gained: number; multiplier: number }
  | { turn: number; kind: "fall"; lost: number }
  | { turn: number; kind: "shield"; kept: number }
  | { turn: number; kind: "bank"; banked: number }
  | { turn: number; kind: "final"; banked: number };

export type LadderTotals = { bank: number; pot: number; multiplier: number; bonus: number; events: LadderEvent[] };

/**
 * `banks`: kasaya alma anları (o ana kadarki kabul edilen tahmin sayısı).
 * `shieldAt`: kalkanın koruduğu yanlış tahmin (1 tabanlı), kullanılmadıysa null.
 */
export function ladderTotals(snapshot: GameSnapshot, banks: readonly number[], shieldAt: number | null): LadderTotals {
  let bank = 0;
  let pot = 0;
  let multiplier = 1;
  let baseInPot = 0;
  let bankedBase = 0;
  const events: LadderEvent[] = [];
  for (const [index, attempt] of snapshot.attempts.entries()) {
    const turn = index + 1;
    if (attempt.verdict === "correct") {
      const gained = LADDER_STEP * multiplier;
      pot += gained;
      baseInPot += LADDER_STEP;
      events.push({ turn, kind: "climb", gained, multiplier });
      multiplier = Math.min(LADDER_MAX_MULTIPLIER, multiplier + 1);
    } else if (shieldAt === turn) {
      events.push({ turn, kind: "shield", kept: pot });
    } else {
      if (pot > 0) events.push({ turn, kind: "fall", lost: pot });
      pot = 0;
      baseInPot = 0;
      multiplier = 1;
    }
    if (banks.includes(turn) && pot > 0) {
      events.push({ turn, kind: "bank", banked: pot });
      bank += pot;
      bankedBase += baseInPot;
      pot = 0;
      baseInPot = 0;
      multiplier = 1;
    }
  }
  if (snapshot.status === "won" && pot > 0) {
    events.push({ turn: snapshot.attempts.length, kind: "final", banked: pot });
    bank += pot;
    bankedBase += baseInPot;
    pot = 0;
  }
  return { bank, pot, multiplier, bonus: Math.max(0, bank - bankedBase), events };
}

// ---------------------------------------------------------------------------
// Bomba Kart: fitil ve zamanlama
// ---------------------------------------------------------------------------

export const BOMB_FUSE = 3;
export const BOMB_COOL_TURNS = 2;
export const BOMB_DEFUSE_BONUS = 100;
export const BOMB_FUSE_BONUS = 50;

/** Bombalı kart tahtadan deterministik seçilir; her oyuncu aynı tahtada aynı kartı görür. */
export function bombFor(puzzle: Puzzle): string {
  const words = puzzle.groups.flatMap((group) => group.words.map((word) => word.id)).sort();
  let hash = 0;
  for (const char of `${puzzle.id}:${puzzle.revision}`) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return words[hash % words.length]!;
}

export type BombState = "armed" | "defused" | "exploded";
export type BombTotals = {
  state: BombState;
  /** Kalan tur; etkisiz kılındı veya patladıysa 0. */
  fuse: number;
  extraMistakes: number;
  remaining: number;
  bonus: number;
  events: { turn: number; text: string }[];
};

/** `cooledAt`: soğutmanın yapıldığı an (o ana kadarki kabul edilen tahmin sayısı), yapılmadıysa null. */
export function bombTotals(puzzle: Puzzle, snapshot: GameSnapshot, bombId: string, cooledAt: number | null): BombTotals {
  const bombGroup = puzzle.groups.find((group) => group.words.some((word) => word.id === bombId));
  let fuse = BOMB_FUSE;
  let state: BombState = "armed";
  let extraMistakes = 0;
  let bonus = 0;
  const events: BombTotals["events"] = [];
  if (cooledAt === 0) fuse += BOMB_COOL_TURNS;
  for (const [index, attempt] of snapshot.attempts.entries()) {
    const turn = index + 1;
    if (state !== "armed") break;
    if (attempt.verdict === "correct" && bombGroup && correctGroup(puzzle, attempt)?.id === bombGroup.id) {
      state = "defused";
      bonus = BOMB_DEFUSE_BONUS + BOMB_FUSE_BONUS * fuse;
      events.push({ turn, text: `Bomba ${fuse} tur kala etkisiz: +${bonus} bonus` });
      fuse = 0;
      break;
    }
    if (attempt.verdict !== "correct" && attempt.wordIds.includes(bombId)) {
      extraMistakes += 1;
      events.push({ turn, text: "Bombalı yanlış tahmin: bir ek hata" });
    }
    fuse -= 1;
    if (cooledAt === turn) fuse += BOMB_COOL_TURNS;
    if (fuse <= 0) {
      state = "exploded";
      extraMistakes += 1;
      events.push({ turn, text: "Fitil bitti, bomba patladı: bir ek hata" });
      fuse = 0;
    }
  }
  return { state, fuse, extraMistakes, remaining: Math.max(0, snapshot.mistakesRemaining - extraMistakes), bonus, events };
}
