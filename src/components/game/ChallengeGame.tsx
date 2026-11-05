"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { GameSnapshot, Puzzle } from "@/features/game/contracts";
import { clearSelection, createInitialSnapshot, createSeededRandom, shuffleBoard, submitSelection, toggleWord } from "@/features/game/engine";
import { checkCompatibility } from "@/lib/persistence/compatibility";
import { parseStoredRecord } from "@/lib/persistence/record";
import { feedbackMessage } from "./presentation";
import { SolvedGroup } from "./SolvedGroup";
import { WordTile } from "./WordTile";
import styles from "./RiskGame.module.css";

export type ChallengeMode = "ladder" | "bomb";
type ChallengeState = { snapshot: GameSnapshot; bombId: string | null; banks: number[] };

function ladderTotals(state: ChallengeState) {
  let bank = 0;
  let pot = 0;
  let multiplier = 1;
  for (const [index, attempt] of state.snapshot.attempts.entries()) {
    if (attempt.verdict === "correct") {
      pot += 100 * multiplier;
      multiplier += 1;
    } else {
      pot = 0;
      multiplier = 1;
    }
    if (state.banks.includes(index + 1)) {
      bank += pot;
      pot = 0;
      multiplier = 1;
    }
  }
  if (state.snapshot.status === "won") return { bank: bank + pot, pot: 0, multiplier };
  return { bank, pot, multiplier };
}

function bombTotals(state: ChallengeState) {
  let bonus = 0;
  let extraMistakes = 0;
  for (const attempt of state.snapshot.attempts) {
    if (attempt.verdict === "correct") bonus += attempt.wordIds.includes(state.bombId ?? "") ? 200 : 100;
    else if (attempt.wordIds.includes(state.bombId ?? "")) extraMistakes += 1;
  }
  return { score: bonus, remaining: Math.max(0, state.snapshot.mistakesRemaining - extraMistakes) };
}

function freshGame(puzzle: Puzzle, mode: ChallengeMode): ChallengeState {
  const snapshot = createInitialSnapshot(puzzle, { random: createSeededRandom(20260920) });
  const words = snapshot.remainingWordOrder;
  return { snapshot, bombId: mode === "bomb" ? words[Math.floor(Math.random() * words.length)] ?? null : null, banks: [] };
}

function readGame(puzzle: Puzzle, mode: ChallengeMode, key: string): ChallengeState | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || !("snapshot" in data) || !("bombId" in data) || !("banks" in data)) return null;
    const parsed = parseStoredRecord(JSON.stringify({ snapshot: data.snapshot }));
    if (!parsed.ok || !checkCompatibility(puzzle, puzzle.date, parsed.record.snapshot).ok || !Array.isArray(data.banks)) return null;
    const allIds = puzzle.groups.flatMap((group) => group.words.map((word) => word.id));
    if (mode === "bomb" ? typeof data.bombId !== "string" || !allIds.includes(data.bombId) : data.bombId !== null) return null;
    const banks: unknown[] = data.banks;
    if (banks.some((n, i) => typeof n !== "number" || !Number.isInteger(n) || n < 1 || n > parsed.record.snapshot.attempts.length || (i > 0 && n <= (banks[i - 1] as number)))) return null;
    if (mode === "bomb" && banks.length) return null;
    return { snapshot: parsed.record.snapshot, bombId: data.bombId as string | null, banks: banks as number[] };
  } catch { return null; }
}

export function ChallengeGame({ puzzle, mode }: { puzzle: Puzzle; mode: ChallengeMode }) {
  const key = `quadro:${mode}:v1:${puzzle.date}:${puzzle.id}:${puzzle.revision}`;
  const [game, setGame] = useState<ChallengeState | null>(null);
  const [message, setMessage] = useState("");
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = readGame(puzzle, mode, key);
      const initial = saved ?? freshGame(puzzle, mode);
      setGame(initial);
      if (!saved) {
        try { localStorage.setItem(key, JSON.stringify(initial)); } catch { setStorageError(true); }
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [puzzle, mode, key]);

  function commit(next: ChallengeState) {
    setGame(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { setStorageError(true); }
  }

  if (!game) return <p className={styles.loading}>Oyun hazırlanıyor…</p>;
  const { snapshot } = game;
  const ladder = ladderTotals(game);
  const bomb = bombTotals(game);
  const remaining = mode === "bomb" ? bomb.remaining : snapshot.mistakesRemaining;
  const finished = snapshot.status !== "playing" || remaining === 0;
  const words = new Map(puzzle.groups.flatMap((group) => group.words.map((word) => [word.id, word])));

  function submit() {
    if (!game || finished || snapshot.selectedWordIds.length !== 4) return;
    const includesBomb = game.bombId !== null && snapshot.selectedWordIds.includes(game.bombId);
    const result = submitSelection(puzzle, snapshot);
    if (result.outcome.verdict === "invalid" || result.outcome.verdict === "repeated") {
      setMessage(feedbackMessage(result.outcome));
      return;
    }
    commit({ ...game, snapshot: result.snapshot });
    const extra = mode === "bomb" && includesBomb ? (result.outcome.verdict === "correct" ? " Bomba bonusu: +100 puan!" : " Bomba patladı: bir ek hata hakkı gitti.") : "";
    setMessage(feedbackMessage(result.outcome) + extra);
  }

  function bankPot() {
    if (!game || finished || ladder.pot === 0) return;
    commit({ ...game, banks: [...game.banks, snapshot.attempts.length] });
    setMessage(`${ladder.pot} puan kasaya alındı. Çarpan yeniden 1×.`);
  }

  return <section className={`q-game-shell ${styles.shell}`} aria-labelledby="challenge-title">
    <div className={styles.heading}><span>QUADRO · {mode === "ladder" ? "ÇARPAN MERDİVENİ" : "BOMBA KART"}</span>
      <h1 id="challenge-title">{mode === "ladder" ? "Devam mı, kasa mı?" : "Bombayı doğru yerde kullan."}</h1>
      <p>{mode === "ladder" ? "Her doğru grup 100 puan × çarpan kazandırır. Kasaya alırsan çarpan sıfırlanır, yanlışta kasaya alınmayan puanlar silinir. Son grupta biriken puan otomatik kasaya girer." : "Bombalı kartı içeren doğru grup 200, diğer doğru gruplar 100 puan kazandırır. Bombalı yanlış tahmin iki hata hakkı götürür."}</p>
      <p>Bugünün günlük bulmacasıyla oynarsın. Dört hata hakkın var.</p></div>
    <div className={styles.scoreboard}><div><span>{mode === "ladder" ? "KASADA" : "PUANIN"}</span><strong>{mode === "ladder" ? ladder.bank : bomb.score}</strong></div><div><span>KALAN HATA</span><strong>{remaining} / 4</strong></div></div>
    {mode === "ladder" && <div className={styles.wager}><span>Ortadaki puan <strong>{ladder.pot}</strong> · Sonraki çarpan <strong>{ladder.multiplier}×</strong></span>
      {!finished && <button type="button" className="q-game-control" disabled={ladder.pot === 0} onClick={bankPot}>Kasaya al</button>}</div>}
    {storageError && <p role="alert">İlerleme kaydedilemedi. Bu sekme açıkken oynamaya devam edebilirsin.</p>}
    {snapshot.solvedGroupIds.map((id) => { const group = puzzle.groups.find((item) => item.id === id); return group ? <SolvedGroup key={id} group={group} /> : null; })}
    {!finished && <>
      <div className="q-game-board" aria-label="Oyun tahtası">{snapshot.remainingWordOrder.map((id) => {
        const word = words.get(id);
        return word ? <div key={id} className={styles.tileWrap}>
          <WordTile id={id} text={word.text} ariaLabel={mode === "bomb" && id === game.bombId ? `${word.text}, bombalı kart` : undefined} selected={snapshot.selectedWordIds.includes(id)} onToggle={() => commit({ ...game, snapshot: toggleWord(puzzle, snapshot, id) })} />
          {mode === "bomb" && id === game.bombId && <span className={styles.bombBadge} aria-hidden="true">💣</span>}
        </div> : null;
      })}</div>
      <div className="q-game-controls"><button type="button" className="q-game-control" onClick={() => commit({ ...game, snapshot: shuffleBoard(snapshot, Math.random) })}>Karıştır</button>
        <button type="button" className="q-game-control" onClick={() => commit({ ...game, snapshot: clearSelection(snapshot) })}>Temizle</button>
        <button type="button" className="q-game-control q-game-submit" disabled={snapshot.selectedWordIds.length !== 4} onClick={submit}>Grupla</button></div>
    </>}
    <p className={styles.feedback} role="status">{message}</p>
    {finished && <div className={styles.result}><h2>{snapshot.status === "won" ? "Dört bağı da buldun!" : "Oyun bitti"}</h2><p>Son puanın <strong>{mode === "ladder" ? ladder.bank : bomb.score}</strong></p>
      {snapshot.status !== "won" && puzzle.groups.filter((group) => !snapshot.solvedGroupIds.includes(group.id)).map((group) => <SolvedGroup key={group.id} group={group} />)}</div>}
    <Link href="/" className={styles.back}>← Ana sayfaya dön</Link>
  </section>;
}
