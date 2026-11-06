"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Puzzle } from "@/features/game/contracts";
import { beginRun, ENERGY_COST, ENERGY_MAX, finishRun, GOAL, readSpecialState, REFILL_MS, saveSpecialState, type SpecialMode, type SpecialRun, type SpecialState } from "@/features/game/specialEnergy";
import { RiskGame } from "./RiskGame";
import { ChallengeGame } from "./ChallengeGame";
import styles from "./RiskGame.module.css";

async function getPuzzle(run: SpecialRun): Promise<Puzzle> {
  const params = new URLSearchParams({ slot: String(run.slot), run: String(run.id), day: run.day });
  const response = await fetch(`/api/challenge-puzzle?${params}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Tahta yüklenemedi. Canın harcanmadı; tekrar dene.");
  return response.json() as Promise<Puzzle>;
}

export function SpecialModeGate({ mode, day }: { mode: SpecialMode; day: string }) {
  const [state, setState] = useState<SpecialState | null>(null);
  const [run, setRun] = useState<SpecialRun | null>(null);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(0);
  const [finishedPoints, setFinishedPoints] = useState<number | null>(null);
  const [hasPrevious, setHasPrevious] = useState(false);
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
    catch { setError("Can bilgisi kaydedilemiyor. Oynamak için tarayıcı depolamasına izin ver."); }
  }, [mode, day]);
  useEffect(() => {
    const timer = window.setTimeout(sync, 0);
    const interval = window.setInterval(sync, 1000);
    window.addEventListener("storage", sync);
    return () => { window.clearTimeout(timer); window.clearInterval(interval); window.removeEventListener("storage", sync); };
  }, [sync]);
  useEffect(() => {
    if (activeId === undefined || activeSlot === undefined || activeMode !== mode || !activeDay || run) return;
    let cancelled = false;
    const active = { id: activeId, slot: activeSlot, mode: activeMode, day: activeDay };
    getPuzzle(active).then(board => { if (!cancelled) { setPuzzle(board); setRun(active); } }).catch(() => { if (!cancelled) setError("Yarım kalan oyun yüklenemedi. Tekrar dene."); });
    return () => { cancelled = true; };
  }, [activeId, activeSlot, activeMode, activeDay, mode, run]);
  const onFinish = useCallback((points: number) => {
    if (!run) return;
    try {
      const current = readSpecialState();
      if (current.active?.id !== run.id) return;
      const next = finishRun(current, run.id, points, Date.now());
      saveSpecialState(next);
      setState(next);
      setFinishedPoints(points);
    } catch { setError("Oyun sonucu kaydedilemedi. Sayfayı yenilemeden tekrar dene."); }
  }, [run]);
  async function start() {
    setBusy(true); setError("");
    try {
      const current = readSpecialState();
      const candidate = beginRun(current, mode, Date.now(), day);
      if (!candidate?.active) { sync(); return; }
      const board = await getPuzzle(candidate.active);
      const latest = readSpecialState();
      const next = beginRun(latest, mode, Date.now(), day);
      if (!next?.active || next.active.id !== candidate.active.id) { sync(); return; }
      saveSpecialState(next);
      setState(next); setPuzzle(board); setRun(next.active); setFinishedPoints(null);
    } catch { setError("Oyun başlatılamadı. Canın harcanmadı; tekrar dene."); }
    finally { setBusy(false); }
  }
  if (!state) return <p className={styles.loading}>{error || "Canların yükleniyor…"}</p>;
  const seconds = Math.max(0, Math.ceil((state.updatedAt + REFILL_MS - now) / 1000));
  const remaining = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const total = state.results.reduce((sum, n) => sum + n, 0);
  const otherActive = state.active && state.active.mode !== mode;
  return <div className={styles.shell}>
    <section className={styles.wager} aria-label="Özel mod canları ve hedefi">
      <strong>⚡ {state.energy} / {ENERGY_MAX} can</strong>
      <span>{state.energy < ENERGY_MAX ? `+10 can için ${remaining}` : "Canların dolu"} · Yeni oyun {ENERGY_COST} can</span>
      <strong>🎯 Üç oyun hedefi: {total} / {GOAL} puan</strong>
      <span>{state.results.length} / 3 oyun tamamlandı. Her doğru grup 100 temel puan; mod bonusları hedefe eklenir. Üç oyun sonunda {GOAL} puana ulaşınca canların dolar.</span>
      {state.lastAward !== null && <span>{state.lastAward >= GOAL ? `🎉 ${state.lastAward} puanla hedefe ulaştın, canların doldu!` : `Son üçlü seri: ${state.lastAward} puan. Yeni seri başladı.`}</span>}
    </section>
    {error && <p role="alert">{error}</p>}
    {error && state.active?.mode === mode && !run && <button type="button" className="q-game-control" onClick={() => window.location.reload()}>Oyunu yeniden yükle</button>}
    {otherActive && <p>Yarım kalan özel oyunun var. Önce <Link href={`/play?mode=${state.active!.mode}`}>o oyuna dön</Link>; yeniden can harcanmaz.</p>}
    {run && puzzle ? <><p>{finishedPoints !== null ? `Bu oyundan hedefe ${finishedPoints} puan eklendi.` : "Bu oyun için 10 can kullanıldı. Dönersen tekrar can harcanmaz."}</p>
      {mode === "risk" ? <RiskGame puzzle={puzzle} onFinish={onFinish} /> : <ChallengeGame puzzle={puzzle} mode={mode} onFinish={onFinish} />}
      {finishedPoints !== null && <button className="q-game-control q-game-submit" type="button" disabled={busy || state.energy < ENERGY_COST} onClick={() => { setRun(null); setPuzzle(null); void start(); }}>Yeni oyun · 10 can</button>}
    </> : !state.active && <button className="q-game-control q-game-submit" type="button" disabled={busy || state.energy < ENERGY_COST} onClick={() => void start()}>{busy ? "Tahta hazırlanıyor…" : state.energy < ENERGY_COST ? "Yeni oyun için 10 can bekle" : "Oyuna başla · 10 can"}</button>}
    {state.active?.mode === mode && !run && !error && <p>Yarım kalan oyun yükleniyor…</p>}
    {hasPrevious && !run && <Link href={`/play?mode=${mode}&legacy=1`}>Önceki günlük oyun kaydını aç →</Link>}
    <Link href="/challenges">← Özel modlara dön</Link>
  </div>;
}
