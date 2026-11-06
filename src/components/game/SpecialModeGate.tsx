"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Puzzle } from "@/features/game/contracts";
import {
  beginRun,
  canStart,
  ENERGY_COST,
  ENERGY_EVENT,
  ENERGY_MAX,
  ENERGY_TO_START,
  finishRun,
  formatCountdown,
  msUntilNextEnergy,
  msUntilStart,
  readSpecialState,
  saveSpecialState,
  type SpecialMode,
  type SpecialRun,
  type SpecialState,
} from "@/features/game/specialEnergy";
import { RiskGame } from "./RiskGame";
import { ChallengeGame } from "./ChallengeGame";
import type { SpecialFinish } from "./specialFinish";
import styles from "./RiskGame.module.css";

async function getPuzzle(run: SpecialRun): Promise<Puzzle> {
  const params = new URLSearchParams({ slot: String(run.slot), run: String(run.id), day: run.day });
  const response = await fetch(`/api/challenge-puzzle?${params}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Tahta yüklenemedi. Enerjin harcanmadı; tekrar dene.");
  return response.json() as Promise<Puzzle>;
}

export function SpecialModeGate({ mode, day }: { mode: SpecialMode; day: string }) {
  const [state, setState] = useState<SpecialState | null>(null);
  const [run, setRun] = useState<SpecialRun | null>(null);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(0);
  const [bonus, setBonus] = useState<number | null>(null);
  const [hasPrevious, setHasPrevious] = useState(false);
  // Aynı karede gelen ikinci tıklama da yeni oyun başlatmasın.
  const starting = useRef(false);
  const activeId = state?.active?.id;
  const activeSlot = state?.active?.slot;
  const activeMode = state?.active?.mode;
  const activeDay = state?.active?.day;
  const sync = useCallback(() => {
    try {
      setState(readSpecialState()); setNow(Date.now());
      const prefix = `quadro:${mode}:v1:${day}:`;
      setHasPrevious(Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)).some(key => key?.startsWith(prefix)));
    }
    catch { setError("Enerji bilgisi kaydedilemiyor. Oynamak için tarayıcı depolamasına izin ver."); }
  }, [mode, day]);
  useEffect(() => {
    const timer = window.setTimeout(sync, 0);
    const interval = window.setInterval(sync, 1000);
    window.addEventListener("storage", sync);
    window.addEventListener(ENERGY_EVENT, sync);
    return () => {
      window.clearTimeout(timer); window.clearInterval(interval);
      window.removeEventListener("storage", sync); window.removeEventListener(ENERGY_EVENT, sync);
    };
  }, [sync]);
  useEffect(() => {
    if (activeId === undefined || activeSlot === undefined || activeMode !== mode || !activeDay || run) return;
    let cancelled = false;
    const active = { id: activeId, slot: activeSlot, mode: activeMode, day: activeDay };
    getPuzzle(active).then(board => { if (!cancelled) { setPuzzle(board); setRun(active); } }).catch(() => { if (!cancelled) setError("Yarım kalan oyun yüklenemedi. Tekrar dene."); });
    return () => { cancelled = true; };
  }, [activeId, activeSlot, activeMode, activeDay, mode, run]);
  const onFinish = useCallback((result: SpecialFinish) => {
    if (!run) return;
    try {
      const current = readSpecialState();
      // Başka sekmede bitmiş veya yeniden yüklenmiş oyun ikinci kez ödül almaz.
      if (current.active?.id !== run.id) return;
      const next = finishRun(current, run.id, { won: result.won, mistakes: result.mistakes }, Date.now());
      saveSpecialState(next);
      setState(next);
      setBonus(result.bonus);
    } catch { setError("Oyun sonucu kaydedilemedi. Sayfayı yenilemeden tekrar dene."); }
  }, [run]);
  async function start() {
    if (starting.current) return;
    starting.current = true;
    setBusy(true); setError("");
    try {
      const candidate = beginRun(readSpecialState(), mode, Date.now(), day);
      if (!candidate?.active) { sync(); return; }
      const board = await getPuzzle(candidate.active);
      // Tahta gelene kadar başka sekme oyun başlatmış olabilir; harcama en güncel durumdan yapılır.
      const next = beginRun(readSpecialState(), mode, Date.now(), day);
      if (!next?.active || next.active.id !== candidate.active.id) { sync(); return; }
      saveSpecialState(next);
      setState(next); setPuzzle(board); setRun(next.active); setBonus(null);
    } catch { setError("Oyun başlatılamadı. Enerjin harcanmadı; tekrar dene."); }
    finally { setBusy(false); starting.current = false; }
  }
  if (!state) return <p className={styles.loading}>{error || "Enerjin yükleniyor…"}</p>;
  const waitMs = msUntilStart(state, now);
  const nextMs = msUntilNextEnergy(state, now);
  const ready = canStart(state);
  const award = state.lastAward;
  const otherActive = state.active && state.active.mode !== mode;
  const startLabel = busy
    ? "Tahta hazırlanıyor…"
    : ready
      ? `Oyuna başla · ${ENERGY_COST} enerji`
      : `Yeni oyun için ${ENERGY_TO_START} enerji gerekir · ${formatCountdown(waitMs)}`;
  return <div className={styles.shell}>
    <section className={styles.wager} aria-label="Özel mod enerjisi">
      <strong><span aria-hidden="true">⚡ </span>{state.energy} / {ENERGY_MAX} enerji</strong>
      <meter min={0} max={ENERGY_MAX} low={ENERGY_TO_START} optimum={ENERGY_MAX} value={state.energy} aria-label={`${state.energy} / ${ENERGY_MAX} enerji`} />
      <span>{nextMs === null ? "Enerjin dolu." : `Sonraki +1 enerji: ${formatCountdown(nextMs)}`}</span>
      <span>{ready || state.active ? `Yeni oyun ${ENERGY_TO_START} enerji ister, ${ENERGY_COST} harcar.` : `Yeni oyuna kalan süre: ${formatCountdown(waitMs)}`}</span>
      <span>Kazanırsan skorun 400 − 100 × yanlış tahmin. Her 200 skor +2 enerji kazandırır; mod bonusları enerji vermez.</span>
    </section>
    {award && <p role="status" aria-live="polite">Son oyun: <strong>{award.score} skor</strong> · <strong>+{award.energy} enerji</strong>{bonus !== null ? ` · mod bonusu ${bonus} (enerji vermez)` : ""}</p>}
    {error && <p role="alert">{error}</p>}
    {error && state.active?.mode === mode && !run && <button type="button" className="q-game-control" onClick={() => window.location.reload()}>Oyunu yeniden yükle</button>}
    {otherActive && <p>Yarım kalan özel oyunun var. Önce <Link href={`/play?mode=${state.active!.mode}`}>o oyuna dön</Link>; yeniden enerji harcanmaz.</p>}
    {run && puzzle ? <><p>{award?.runId === run.id ? "Oyun bitti; sonuç yukarıda." : `Bu oyun için ${ENERGY_COST} enerji kullanıldı. Dönersen tekrar harcanmaz.`}</p>
      {mode === "risk" ? <RiskGame puzzle={puzzle} onFinish={onFinish} /> : <ChallengeGame puzzle={puzzle} mode={mode} onFinish={onFinish} />}
      {award?.runId === run.id && <button className="q-game-control q-game-submit" type="button" disabled={busy || !ready} onClick={() => { setRun(null); setPuzzle(null); void start(); }}>{startLabel}</button>}
    </> : !state.active && <button className="q-game-control q-game-submit" type="button" disabled={busy || !ready} onClick={() => void start()}>{startLabel}</button>}
    {state.active?.mode === mode && !run && !error && <p>Yarım kalan oyun yükleniyor…</p>}
    {hasPrevious && !run && <Link href={`/play?mode=${mode}&legacy=1`}>Önceki günlük oyun kaydını aç →</Link>}
    <Link href="/challenges">← Özel modlara dön</Link>
  </div>;
}
