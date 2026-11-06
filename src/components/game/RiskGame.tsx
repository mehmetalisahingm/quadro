"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { GameSnapshot, Puzzle } from "@/features/game/contracts";
import { clearSelection, createInitialSnapshot, createSeededRandom, shuffleBoard, submitSelection, toggleWord } from "@/features/game/engine";
import { checkCompatibility } from "@/lib/persistence/compatibility";
import { parseStoredRecord } from "@/lib/persistence/record";
import { feedbackMessage } from "./presentation";
import { specialFinish, specialProgress, specialStart } from "@/lib/analytics/specialMode";
import { persistSignedInSpecialResult } from "@/lib/results/remote";
import { SolvedGroup } from "./SolvedGroup";
import { WordTile } from "./WordTile";
import styles from "./RiskGame.module.css";

type RiskState = { snapshot: GameSnapshot; wagers: number[] };

function scoreFor(state: RiskState): number {
  return state.snapshot.attempts.reduce((score, attempt, index) =>
    score + (attempt.verdict === "correct" ? (state.wagers[index] ?? 0) : -(state.wagers[index] ?? 0)), 100);
}

function readGame(puzzle: Puzzle, key: string): RiskState {
  const fresh = { snapshot: createInitialSnapshot(puzzle, { random: createSeededRandom(20260920) }), wagers: [] };
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fresh;
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || !("snapshot" in data) || !("wagers" in data)) return fresh;
    const parsed = parseStoredRecord(JSON.stringify({ snapshot: data.snapshot }));
    if (!parsed.ok || !checkCompatibility(puzzle, puzzle.date, parsed.record.snapshot).ok || !Array.isArray(data.wagers)) return fresh;
    const wagers: unknown[] = data.wagers;
    if (wagers.length !== parsed.record.snapshot.attempts.length) return fresh;
    let balance = 100;
    for (let i = 0; i < wagers.length; i++) {
      const amount = wagers[i];
      if (typeof amount !== "number" || !Number.isInteger(amount) || amount < 1 || amount > balance) return fresh;
      balance += parsed.record.snapshot.attempts[i]?.verdict === "correct" ? amount : -amount;
      if (balance === 0 && i !== wagers.length - 1) return fresh;
    }
    return { snapshot: parsed.record.snapshot, wagers: wagers as number[] };
  } catch { return fresh; }
}

export function RiskGame({ puzzle, onFinish }: { puzzle: Puzzle; onFinish?: (points: number) => void }) {
  const key = `quadro:risk:v1:${puzzle.date}:${puzzle.id}:${puzzle.revision}`;
  const [game, setGame] = useState<RiskState | null>(null);
  const [wager, setWager] = useState(10);
  const [message, setMessage] = useState("");
  const [storageError, setStorageError] = useState(false);
  const submittedResult = useRef<string | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => setGame(readGame(puzzle, key)), 0);
    return () => window.clearTimeout(timer);
  }, [puzzle, key]);
  useEffect(() => {
    if (!game) return;
    const balance = scoreFor(game);
    if (onFinish && game.snapshot.status === "playing" && balance > 0) specialStart(puzzle, "risk", game.snapshot.attempts.length > 0);
    if (game.snapshot.status !== "playing" || balance === 0) {
      const base = game.snapshot.solvedGroupIds.length * 100;
      const points = base + Math.max(0, balance - 100);
      if (onFinish) specialFinish(puzzle, "risk", game.snapshot, game.snapshot.mistakesRemaining, points);
      if (onFinish && submittedResult.current !== puzzle.id) {
        submittedResult.current = puzzle.id;
        persistSignedInSpecialResult(game.snapshot, { mode: "risk", wagers: game.wagers });
      }
      onFinish?.(points);
    }
  }, [game, onFinish, puzzle]);

  function commit(next: RiskState) {
    setGame(next);
    try { localStorage.setItem(key, JSON.stringify(next)); }
    catch { setStorageError(true); }
  }
  if (!game) return <p className={styles.loading}>Oyun hazırlanıyor…</p>;
  const { snapshot } = game;
  const score = scoreFor(game);
  const finished = snapshot.status !== "playing" || score === 0;
  const amount = Math.min(wager, score);
  const words = new Map(puzzle.groups.flatMap((group) => group.words.map((word) => [word.id, word])));

  function submit() {
    if (!game || finished || snapshot.selectedWordIds.length !== 4) return;
    const result = submitSelection(puzzle, snapshot);
    setMessage(feedbackMessage(result.outcome));
    if (result.outcome.verdict === "invalid" || result.outcome.verdict === "repeated") return;
    commit({ snapshot: result.snapshot, wagers: [...game.wagers, amount] });
    if (onFinish) specialProgress(puzzle, "risk", result.snapshot, result.snapshot.mistakesRemaining);
    setMessage(`${feedbackMessage(result.outcome)} ${result.outcome.verdict === "correct" ? "+" : "−"}${amount} puan.`);
  }

  return <section className={`q-game-shell ${styles.shell}`} aria-labelledby="risk-title">
    <div className={styles.heading}><span>QUADRO · RİSK</span><h1 id="risk-title">Ne kadar eminsin?</h1>
      <p>100 puanla başla. Dörtlünü seç, puan yatır. Doğru tahmin kazandırır, yanlış tahmin yatırdığın puanı götürür. Dört hatada veya puanın sıfıra inince oyun biter.</p>
      <p>{onFinish ? "Her doğru grup 100 temel puan kazandırır; 100 başlangıç puanının üzerindeki bakiyen bonus olarak üç oyun hedefine eklenir." : "Bugünün günlük bulmacasıyla oynarsın."}</p></div>
    <div className={styles.scoreboard}><div><span>PUANIN</span><strong>{score}</strong></div><div><span>KALAN HATA</span><strong>{snapshot.mistakesRemaining} / 4</strong></div></div>
    {onFinish && <p>Hedefe yazılacak puan: <strong>{snapshot.solvedGroupIds.length * 100 + Math.max(0, score - 100)}</strong></p>}
    {storageError && <p role="alert">İlerleme kaydedilemedi. Bu sekme açıkken oynamaya devam edebilirsin.</p>}
    {snapshot.solvedGroupIds.map((id) => { const group = puzzle.groups.find((item) => item.id === id); return group ? <SolvedGroup key={id} group={group} /> : null; })}
    {!finished && <>
      <div className="q-game-board" aria-label="Risk oyun tahtası">{snapshot.remainingWordOrder.map((id) => {
        const word = words.get(id);
        return word ? <WordTile key={id} id={id} text={word.text} selected={snapshot.selectedWordIds.includes(id)} onToggle={() => commit({ ...game, snapshot: toggleWord(puzzle, snapshot, id) })} /> : null;
      })}</div>
      <div className={styles.wager}><label htmlFor="risk-wager">Yatıracağın puan <strong>{amount}</strong></label>
        <input id="risk-wager" type="range" min="1" max={score} value={amount} onChange={(event) => setWager(Number(event.target.value))} />
        <div><span>1 puan</span><span>{score} puan</span></div></div>
      <div className="q-game-controls"><button type="button" className="q-game-control" onClick={() => commit({ ...game, snapshot: shuffleBoard(snapshot, Math.random) })}>Karıştır</button>
        <button type="button" className="q-game-control" onClick={() => commit({ ...game, snapshot: clearSelection(snapshot) })}>Temizle</button>
        <button type="button" className="q-game-control q-game-submit" disabled={snapshot.selectedWordIds.length !== 4} onClick={submit}>Grupla</button></div>
    </>}
    <p className={styles.feedback} role="status">{message}</p>
    {finished && <div className={styles.result}><h2>{snapshot.status === "won" ? "Dört bağı da buldun!" : "Oyun bitti"}</h2><p>Son puanın <strong>{score}</strong></p>
      {snapshot.status !== "won" && puzzle.groups.filter((group) => !snapshot.solvedGroupIds.includes(group.id)).map((group) => <SolvedGroup key={group.id} group={group} />)}</div>}
    <Link href="/" className={styles.back}>← Ana sayfaya dön</Link>
  </section>;
}
