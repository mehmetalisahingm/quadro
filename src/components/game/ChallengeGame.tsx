"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { GameSnapshot, Puzzle } from "@/features/game/contracts";
import { clearSelection, createInitialSnapshot, createSeededRandom, shuffleBoard, submitSelection, toggleWord } from "@/features/game/engine";
import {
  BOMB_COOL_TURNS,
  BOMB_DEFUSE_BONUS,
  BOMB_FUSE,
  BOMB_FUSE_BONUS,
  bombFor,
  bombTotals,
  LADDER_MAX_MULTIPLIER,
  LADDER_STEP,
  ladderTotals,
  type LadderEvent,
} from "@/features/game/specialModes";
import { checkCompatibility } from "@/lib/persistence/compatibility";
import { parseStoredRecord } from "@/lib/persistence/record";
import { ModeIntro } from "./ModeIntro";
import { wrongGuesses, type SpecialFinish } from "./specialFinish";
import { feedbackMessage } from "./presentation";
import { SolvedGroup } from "./SolvedGroup";
import { WordTile } from "./WordTile";
import styles from "./RiskGame.module.css";

export type ChallengeMode = "ladder" | "bomb";
/**
 * `banks`: kasaya alma anları; `shieldAt`: kalkanın koruduğu yanlış tahmin; `shieldArmed`: kalkan kurulu;
 * `cooledAt`: bombanın soğutulduğu an. Eski kayıtlarda son üçü yoktur ve varsayılan değerle açılır.
 */
type ChallengeState = { snapshot: GameSnapshot; bombId: string | null; banks: number[]; shieldAt: number | null; shieldArmed: boolean; cooledAt: number | null };

const LADDER_RULES = [
  ["🪜", "Her doğru grup 100 × çarpan getirir; çarpan 1× → 2× → 3× → 4× yükselir."],
  ["🏦", "Kasaya al: ortadaki puan güvene girer, çarpan 1×'e döner."],
  ["💥", "Yanlış tahmin kasaya alınmamış puanı ve çarpanı sıfırlar."],
  ["🛡️", "Kalkan tek kullanımlıktır: kurduktan sonraki ilk yanlışta puan ve çarpan korunur."],
] as const;
const BOMB_RULES = [
  ["💣", "Bombalı kartın grubunu bul, bombayı etkisiz kıl: +100 ve kalan her tur için +50."],
  ["⏳", `Fitil ${BOMB_FUSE} tahminlik. Bomba grubunu çözmeyen her tahmin fitili bir azaltır; biterse patlar ve bir ek hata yazar.`],
  ["❄️", `Soğut tek kullanımlıktır: fitile ${BOMB_COOL_TURNS} tur ekler.`],
  ["⚠️", "Bombalı kartı içeren yanlış tahmin bir ek hata yazar."],
] as const;

function freshGame(puzzle: Puzzle, mode: ChallengeMode): ChallengeState {
  const snapshot = createInitialSnapshot(puzzle, { random: createSeededRandom(20260920) });
  return { snapshot, bombId: mode === "bomb" ? bombFor(puzzle) : null, banks: [], shieldAt: null, shieldArmed: false, cooledAt: null };
}

const optionalTurn = (value: unknown, max: number) =>
  value === undefined || value === null ? null : Number.isInteger(value) && (value as number) >= 0 && (value as number) <= max ? value as number : undefined;

function readGame(puzzle: Puzzle, mode: ChallengeMode, key: string): ChallengeState | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || !("snapshot" in data) || !("bombId" in data) || !("banks" in data)) return null;
    const parsed = parseStoredRecord(JSON.stringify({ snapshot: data.snapshot }));
    if (!parsed.ok || !checkCompatibility(puzzle, puzzle.date, parsed.record.snapshot).ok || !Array.isArray(data.banks)) return null;
    const turns = parsed.record.snapshot.attempts.length;
    const allIds = puzzle.groups.flatMap((group) => group.words.map((word) => word.id));
    if (mode === "bomb" ? typeof data.bombId !== "string" || !allIds.includes(data.bombId) : data.bombId !== null) return null;
    const banks: unknown[] = data.banks;
    if (banks.some((n, i) => typeof n !== "number" || !Number.isInteger(n) || n < 1 || n > turns || (i > 0 && n <= (banks[i - 1] as number)))) return null;
    if (mode === "bomb" && banks.length) return null;
    const record = data as Record<string, unknown>;
    const shieldAt = optionalTurn(record.shieldAt, turns);
    const cooledAt = optionalTurn(record.cooledAt, turns);
    if (shieldAt === undefined || cooledAt === undefined) return null;
    return {
      snapshot: parsed.record.snapshot,
      bombId: data.bombId as string | null,
      banks: banks as number[],
      shieldAt,
      shieldArmed: record.shieldArmed === true && shieldAt === null,
      cooledAt,
    };
  } catch { return null; }
}

function ladderLine(event: LadderEvent): string {
  switch (event.kind) {
    case "climb": return `${event.turn}. tahmin · ${event.multiplier}× basamak · +${event.gained}`;
    case "fall": return `${event.turn}. tahmin · yanlış · ortadaki ${event.lost} puan gitti`;
    case "shield": return `${event.turn}. tahmin · yanlış · kalkan ${event.kept} puanı ve çarpanı korudu`;
    case "bank": return `${event.turn}. tahminden sonra · ${event.banked} puan kasaya alındı`;
    case "final": return `Son grup · ${event.banked} puan kasaya girdi`;
  }
}

export function ChallengeGame({ puzzle, mode, onFinish }: { puzzle: Puzzle; mode: ChallengeMode; onFinish?: (result: SpecialFinish) => void }) {
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

  const ladder = game ? ladderTotals(game.snapshot, game.banks, game.shieldAt) : null;
  const bomb = game && game.bombId ? bombTotals(puzzle, game.snapshot, game.bombId, game.cooledAt) : null;
  const remaining = game ? (mode === "bomb" && bomb ? bomb.remaining : game.snapshot.mistakesRemaining) : 4;
  const finished = !!game && (game.snapshot.status !== "playing" || remaining === 0);
  const won = !!game && game.snapshot.status === "won" && remaining > 0;
  const bonus = mode === "bomb" ? bomb?.bonus ?? 0 : ladder?.bonus ?? 0;

  useEffect(() => {
    if (!game || !finished) return;
    onFinish?.({ won, mistakes: wrongGuesses(game.snapshot), bonus });
  }, [game, finished, won, bonus, onFinish]);

  function commit(next: ChallengeState) {
    setGame(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { setStorageError(true); }
  }

  if (!game || !ladder) return <p className={styles.loading}>Oyun hazırlanıyor…</p>;
  const { snapshot } = game;
  const words = new Map(puzzle.groups.flatMap((group) => group.words.map((word) => [word.id, word])));

  function submit() {
    if (!game || finished || snapshot.selectedWordIds.length !== 4) return;
    const includesBomb = game.bombId !== null && snapshot.selectedWordIds.includes(game.bombId);
    const result = submitSelection(puzzle, snapshot);
    if (result.outcome.verdict === "invalid" || result.outcome.verdict === "repeated") {
      setMessage(feedbackMessage(result.outcome));
      return;
    }
    const turn = result.snapshot.attempts.length;
    const shielded = mode === "ladder" && game.shieldArmed && result.outcome.verdict !== "correct";
    const next: ChallengeState = { ...game, snapshot: result.snapshot, shieldAt: shielded ? turn : game.shieldAt, shieldArmed: game.shieldArmed && !shielded };
    commit(next);
    let extra = "";
    if (shielded) extra = " Kalkan puanını ve çarpanını korudu.";
    if (mode === "bomb" && next.bombId) {
      const after = bombTotals(puzzle, next.snapshot, next.bombId, next.cooledAt);
      if (bomb?.state === "armed" && after.state === "defused") extra = ` Bomba etkisiz: +${after.bonus} bonus!`;
      else if (bomb?.state === "armed" && after.state === "exploded") extra = " Fitil bitti, bomba patladı: bir ek hata.";
      else if (includesBomb && result.outcome.verdict !== "correct") extra = " Bombalı yanlış: bir ek hata.";
      else if (after.state === "armed") extra = ` Fitilde ${after.fuse} tur kaldı.`;
    }
    setMessage(feedbackMessage(result.outcome) + extra);
  }

  function bankPot() {
    if (!game || finished || !ladder || ladder.pot === 0) return;
    commit({ ...game, banks: [...game.banks, snapshot.attempts.length] });
    setMessage(`${ladder.pot} puan kasaya alındı. Çarpan yeniden 1×.`);
  }

  const shieldUsed = game.shieldAt !== null;
  const nextGain = LADDER_STEP * ladder.multiplier;
  const coolUsed = game.cooledAt !== null;

  return <section className={`q-game-shell ${styles.shell}`} aria-labelledby="challenge-title">
    <div className={styles.heading}><span>QUADRO · {mode === "ladder" ? "ÇARPAN MERDİVENİ" : "BOMBA KART"}</span>
      <h1 id="challenge-title">{mode === "ladder" ? "Devam mı, kasa mı?" : "Fitil bitmeden bul."}</h1>
      <p>{onFinish ? "Kazanırsan temel skorun 400 − 100 × yanlış tahmindir; dört hata hakkın var. Mod bonusu enerji kazandırmaz." : "Bugünün günlük bulmacasıyla oynarsın; dört hata hakkın var."}</p></div>
    {mode === "ladder"
      ? <ModeIntro mode="ladder" title="Çarpan Merdiveni nasıl oynanır?" rules={LADDER_RULES} />
      : <ModeIntro mode="bomb" title="Bomba Kart nasıl oynanır?" rules={BOMB_RULES} />}
    <div className={styles.scoreboard}><div><span>{mode === "ladder" ? "KASADA" : "BONUS"}</span><strong>{mode === "ladder" ? ladder.bank : bonus}</strong></div><div><span>KALAN HATA</span><strong>{remaining} / 4</strong></div></div>
    {onFinish && <p>Mod bonusu: <strong>{bonus}</strong> · enerji vermez{mode === "ladder" && ladder.pot > 0 ? " (ortadaki puan kasaya alınca bonus olabilir)" : ""}</p>}
    {mode === "ladder" && <div className={styles.wager}>
      <ol className={styles.steps} aria-label={`Çarpan ${ladder.multiplier}×`}>
        {Array.from({ length: LADDER_MAX_MULTIPLIER }, (_, i) => i + 1).map((step) => <li key={step} data-current={step === ladder.multiplier} data-passed={step < ladder.multiplier}>{step}×</li>)}
      </ol>
      <span>Ortadaki puan <strong>{ladder.pot}</strong> · Sonraki çarpan <strong>{ladder.multiplier}×</strong>{!finished && <> · Sıradaki doğru grup: +{nextGain}</>}</span>
      {!finished && <div className={styles.actions}>
        <button type="button" className="q-game-control" disabled={ladder.pot === 0} onClick={bankPot}>Kasaya al</button>
        <button type="button" className="q-game-control" disabled={shieldUsed || game.shieldArmed} aria-pressed={game.shieldArmed} onClick={() => { commit({ ...game, shieldArmed: true }); setMessage("Kalkan kuruldu: sıradaki yanlış tahmin puanını silmez."); }}>
          {shieldUsed ? "Kalkan kullanıldı" : game.shieldArmed ? "Kalkan kurulu" : "Kalkanı kur"}
        </button>
      </div>}
    </div>}
    {mode === "bomb" && bomb && <div className={styles.wager}>
      <span>{bomb.state === "armed" ? <>Fitil: <strong>{bomb.fuse}</strong> tur · şimdi etkisiz kılarsan +{BOMB_DEFUSE_BONUS + BOMB_FUSE_BONUS * bomb.fuse}</> : bomb.state === "defused" ? "Bomba etkisiz kılındı." : "Bomba patladı."}</span>
      {!finished && bomb.state === "armed" && <button type="button" className="q-game-control" disabled={coolUsed} onClick={() => { commit({ ...game, cooledAt: snapshot.attempts.length }); setMessage(`Fitil soğutuldu: +${BOMB_COOL_TURNS} tur.`); }}>
        {coolUsed ? "Soğutma kullanıldı" : `Soğut · +${BOMB_COOL_TURNS} tur`}
      </button>}
    </div>}
    {storageError && <p role="alert">İlerleme kaydedilemedi. Bu sekme açıkken oynamaya devam edebilirsin.</p>}
    {snapshot.solvedGroupIds.map((id) => { const group = puzzle.groups.find((item) => item.id === id); return group ? <SolvedGroup key={id} group={group} /> : null; })}
    {!finished && <>
      <div className="q-game-board" aria-label="Oyun tahtası">{snapshot.remainingWordOrder.map((id) => {
        const word = words.get(id);
        const isBomb = mode === "bomb" && id === game.bombId && bomb?.state === "armed";
        return word ? <div key={id} className={styles.tileWrap}>
          <WordTile id={id} text={word.text} ariaLabel={isBomb ? `${word.text}, bombalı kart` : undefined} selected={snapshot.selectedWordIds.includes(id)} onToggle={() => commit({ ...game, snapshot: toggleWord(puzzle, snapshot, id) })} />
          {isBomb && <span className={styles.bombBadge} aria-hidden="true">💣</span>}
        </div> : null;
      })}</div>
      <div className="q-game-controls"><button type="button" className="q-game-control" onClick={() => commit({ ...game, snapshot: shuffleBoard(snapshot, Math.random) })}>Karıştır</button>
        <button type="button" className="q-game-control" onClick={() => commit({ ...game, snapshot: clearSelection(snapshot) })}>Temizle</button>
        <button type="button" className="q-game-control q-game-submit" disabled={snapshot.selectedWordIds.length !== 4} onClick={submit}>Grupla</button></div>
    </>}
    <p className={styles.feedback} role="status">{message}</p>
    {finished && <div className={styles.result}><h2>{won ? "Dört bağı da buldun!" : "Oyun bitti"}</h2><p>Son puanın <strong>{mode === "ladder" ? ladder.bank : bonus}</strong> · mod bonusu {bonus}</p>
      <ol className={styles.timeline} aria-label="Kararların ve etkileri">
        {mode === "ladder"
          ? ladder.events.map((event, i) => <li key={i}>{ladderLine(event)}</li>)
          : bomb?.events.map((event, i) => <li key={i}>{event.turn}. tahmin · {event.text}</li>)}
        {mode === "bomb" && game.cooledAt !== null && <li>Fitil {game.cooledAt}. tahminden sonra soğutuldu (+{BOMB_COOL_TURNS} tur)</li>}
      </ol>
      {!won && puzzle.groups.filter((group) => !snapshot.solvedGroupIds.includes(group.id)).map((group) => <SolvedGroup key={group.id} group={group} />)}</div>}
    <Link href="/" className={styles.back}>← Ana sayfaya dön</Link>
  </section>;
}
