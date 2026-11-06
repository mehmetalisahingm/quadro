"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { GameSnapshot, Puzzle } from "@/features/game/contracts";
import { clearSelection, createInitialSnapshot, createSeededRandom, shuffleBoard, submitSelection, toggleWord } from "@/features/game/engine";
import {
  legacyRiskPlays,
  legendAvailable,
  RISK_STAKES,
  RISK_START,
  riskBonus,
  riskTimeline,
  type RiskPlay,
  type RiskStance,
  type Tier,
} from "@/features/game/specialModes";
import { checkCompatibility } from "@/lib/persistence/compatibility";
import { parseStoredRecord } from "@/lib/persistence/record";
import { ModeIntro } from "./ModeIntro";
import { wrongGuesses, type SpecialFinish } from "./specialFinish";
import { feedbackMessage } from "./presentation";
import { SolvedGroup } from "./SolvedGroup";
import { WordTile } from "./WordTile";
import styles from "./RiskGame.module.css";

type RiskState = { snapshot: GameSnapshot; plays: RiskPlay[] };

const STANCES: readonly RiskStance[] = ["safe", "bold", "legend"];
const TIERS: readonly { tier: Tier; label: string }[] = [
  { tier: 1, label: "Sarı · en kolay" },
  { tier: 2, label: "Yeşil" },
  { tier: 3, label: "Mavi" },
  { tier: 4, label: "Mor · en zor" },
];
const RULES = [
  ["🛡️", "Her tahminden önce duruşunu seç: Güvenli +25 / −25, Cesur +75 / −50, Efsane +150 / −100."],
  ["🎯", "Efsane'de grubun zorluk rengini de tahmin et. Renk tutmazsa doğru grup yalnız +50 getirir."],
  ["🔗", "Efsane yalnız bir önceki tahminin doğruysa açılır; yanlış bir tahmin zinciri koparır."],
  ["💰", "100 puanla başlarsın. Pot sıfırlanırsa oyun biter. 100'ün üstü mod bonusudur."],
] as const;

function isPlay(value: unknown): value is RiskPlay {
  if (!value || typeof value !== "object") return false;
  const play = value as Record<string, unknown>;
  return STANCES.includes(play.stance as RiskStance) && (play.tier === null || [1, 2, 3, 4].includes(play.tier as number));
}

function readGame(puzzle: Puzzle, key: string, legacyKey: string): RiskState {
  const fresh = { snapshot: createInitialSnapshot(puzzle, { random: createSeededRandom(20260920) }), plays: [] };
  try {
    const raw = localStorage.getItem(key) ?? localStorage.getItem(legacyKey);
    if (!raw) return fresh;
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || !("snapshot" in data)) return fresh;
    const parsed = parseStoredRecord(JSON.stringify({ snapshot: data.snapshot }));
    if (!parsed.ok || !checkCompatibility(puzzle, puzzle.date, parsed.record.snapshot).ok) return fresh;
    const attempts = parsed.record.snapshot.attempts;
    let plays: RiskPlay[];
    if ("plays" in data && Array.isArray(data.plays) && data.plays.every(isPlay)) plays = data.plays;
    else if ("wagers" in data && Array.isArray(data.wagers) && data.wagers.every((n) => Number.isInteger(n) && n > 0)) plays = legacyRiskPlays(data.wagers as number[]);
    else return fresh;
    return plays.length === attempts.length ? { snapshot: parsed.record.snapshot, plays } : fresh;
  } catch { return fresh; }
}

export function RiskGame({ puzzle, onFinish }: { puzzle: Puzzle; onFinish?: (result: SpecialFinish) => void }) {
  const key = `quadro:risk:v2:${puzzle.date}:${puzzle.id}:${puzzle.revision}`;
  const legacyKey = `quadro:risk:v1:${puzzle.date}:${puzzle.id}:${puzzle.revision}`;
  const [game, setGame] = useState<RiskState | null>(null);
  const [stance, setStance] = useState<RiskStance>("safe");
  const [tier, setTier] = useState<Tier>(1);
  const [message, setMessage] = useState("");
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setGame(readGame(puzzle, key, legacyKey)), 0);
    return () => window.clearTimeout(timer);
  }, [puzzle, key, legacyKey]);
  const timeline = game ? riskTimeline(puzzle, game.snapshot.attempts, game.plays) : [];
  const pot = timeline.at(-1)?.pot ?? RISK_START;
  const finished = !!game && (game.snapshot.status !== "playing" || pot === 0);
  useEffect(() => {
    if (!game || !finished) return;
    onFinish?.({ won: game.snapshot.status === "won", mistakes: wrongGuesses(game.snapshot), bonus: riskBonus(pot) });
  }, [game, finished, pot, onFinish]);

  function commit(next: RiskState) {
    setGame(next);
    try { localStorage.setItem(key, JSON.stringify(next)); }
    catch { setStorageError(true); }
  }
  if (!game) return <p className={styles.loading}>Oyun hazırlanıyor…</p>;
  const { snapshot } = game;
  const canLegend = legendAvailable(snapshot.attempts);
  const chosen: RiskStance = stance === "legend" && !canLegend ? "bold" : stance;
  const words = new Map(puzzle.groups.flatMap((group) => group.words.map((word) => [word.id, word])));

  function submit() {
    if (!game || finished || snapshot.selectedWordIds.length !== 4) return;
    const result = submitSelection(puzzle, snapshot);
    if (result.outcome.verdict === "invalid" || result.outcome.verdict === "repeated") { setMessage(feedbackMessage(result.outcome)); return; }
    const play: RiskPlay = { stance: chosen, tier: chosen === "legend" ? tier : null };
    const next = { snapshot: result.snapshot, plays: [...game.plays, play] };
    commit(next);
    const step = riskTimeline(puzzle, next.snapshot.attempts, next.plays).at(-1)!;
    const colour = step.tierHit === false ? " Renk tutmadı." : step.tierHit ? " Renk de doğru!" : "";
    setMessage(`${feedbackMessage(result.outcome)}${colour} ${step.delta >= 0 ? "+" : "−"}${Math.abs(step.delta)} puan.`);
    if (step.verdict !== "correct" && stance === "legend") setStance("bold");
  }

  return <section className={`q-game-shell ${styles.shell}`} aria-labelledby="risk-title">
    <div className={styles.heading}><span>QUADRO · RİSK</span><h1 id="risk-title">Ne kadar eminsin?</h1>
      <p>{onFinish ? "Kazanırsan temel skorun 400 − 100 × yanlış tahmindir. Pot'un 100'ü aşan kısmı mod bonusudur; enerji kazandırmaz." : "Bugünün günlük bulmacasıyla oynarsın."}</p></div>
    <ModeIntro mode="risk" title="Risk nasıl oynanır?" rules={RULES} />
    <div className={styles.scoreboard}><div><span>POT</span><strong>{pot}</strong></div><div><span>KALAN HATA</span><strong>{snapshot.mistakesRemaining} / 4</strong></div></div>
    {onFinish && <p>Mod bonusu: <strong>{riskBonus(pot)}</strong> · enerji vermez</p>}
    {storageError && <p role="alert">İlerleme kaydedilemedi. Bu sekme açıkken oynamaya devam edebilirsin.</p>}
    {snapshot.solvedGroupIds.map((id) => { const group = puzzle.groups.find((item) => item.id === id); return group ? <SolvedGroup key={id} group={group} /> : null; })}
    {!finished && <>
      <div className="q-game-board" aria-label="Risk oyun tahtası">{snapshot.remainingWordOrder.map((id) => {
        const word = words.get(id);
        return word ? <WordTile key={id} id={id} text={word.text} selected={snapshot.selectedWordIds.includes(id)} onToggle={() => commit({ ...game, snapshot: toggleWord(puzzle, snapshot, id) })} /> : null;
      })}</div>
      <fieldset className={styles.wager}>
        <legend>Bu tahmin için duruşun</legend>
        <div className={styles.choices}>
          {STANCES.map((value) => {
            const stake = RISK_STAKES[value];
            const disabled = value === "legend" && !canLegend;
            return <label key={value} className={styles.choice} data-checked={chosen === value} data-disabled={disabled}>
              <input type="radio" name="risk-stance" value={value} checked={chosen === value} disabled={disabled} onChange={() => setStance(value)} />
              <strong>{stake.label}</strong><span>+{stake.win} / −{stake.lose}</span>
            </label>;
          })}
        </div>
        {!canLegend && <span>Efsane için önceki tahminin doğru olmalı.</span>}
        {chosen === "legend" && <label className={styles.tierSelect}>Grubun zorluk rengi
          <select value={tier} onChange={(event) => setTier(Number(event.target.value) as Tier)}>
            {TIERS.map((item) => <option key={item.tier} value={item.tier}>{item.label}</option>)}
          </select>
        </label>}
      </fieldset>
      <div className="q-game-controls"><button type="button" className="q-game-control" onClick={() => commit({ ...game, snapshot: shuffleBoard(snapshot, Math.random) })}>Karıştır</button>
        <button type="button" className="q-game-control" onClick={() => commit({ ...game, snapshot: clearSelection(snapshot) })}>Temizle</button>
        <button type="button" className="q-game-control q-game-submit" disabled={snapshot.selectedWordIds.length !== 4} onClick={submit}>Grupla</button></div>
    </>}
    <p className={styles.feedback} role="status">{message}</p>
    {finished && <div className={styles.result}><h2>{snapshot.status === "won" ? "Dört bağı da buldun!" : "Oyun bitti"}</h2><p>Son pot <strong>{pot}</strong> · mod bonusu {riskBonus(pot)}</p>
      <ol className={styles.timeline} aria-label="Kararların ve etkileri">
        {timeline.map((step) => <li key={step.turn}>{step.turn}. tahmin · {RISK_STAKES[step.stance].label}{step.tier ? ` (renk ${step.tier})` : ""} · {step.verdict === "correct" ? "doğru" : "yanlış"}{step.tierHit === false ? ", renk tutmadı" : ""} · {step.delta >= 0 ? "+" : "−"}{Math.abs(step.delta)} → {step.pot}</li>)}
      </ol>
      {snapshot.status !== "won" && puzzle.groups.filter((group) => !snapshot.solvedGroupIds.includes(group.id)).map((group) => <SolvedGroup key={group.id} group={group} />)}</div>}
    <Link href="/" className={styles.back}>← Ana sayfaya dön</Link>
  </section>;
}
