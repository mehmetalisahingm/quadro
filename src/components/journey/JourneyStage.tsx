"use client";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import type { Puzzle } from "@/features/game/contracts";
import { GameBoard } from "@/components/game/GameBoard";
import { journeyDifficulty, journeyHref, JOURNEY_LESSONS, JOURNEY_LENGTH, JOURNEY_WORLDS } from "@/features/game/journey";
import { emptyJourneySnapshot, journeyProgressSnapshot, retryJourneyStep, subscribeJourney, type JourneyProgress } from "@/lib/persistence/journeyProgress";
import { hintStorageKey } from "@/features/game/difficulty";
import { currentUserIsAdmin } from "@/lib/auth/admin";
import { readStoredSession, AUTH_SESSION_EVENT } from "@/lib/auth/client";
import styles from "./Journey.module.css";

export function JourneyStage({ puzzle, step }: { puzzle: Puzzle; step: number }) {
  const raw = useSyncExternalStore(subscribeJourney, journeyProgressSnapshot, emptyJourneySnapshot);
  const progress: JourneyProgress = raw ? JSON.parse(raw) : { unlocked: 1, complete: 0, stars: [], states: [] };
  const [admin, setAdmin] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    let generation = 0;
    const sync = () => {
      const request = ++generation;
      if (!readStoredSession()) { setAdmin(false); return; }
      void currentUserIsAdmin().then(value => { if (active && request === generation) setAdmin(value); });
    };
    sync();
    window.addEventListener(AUTH_SESSION_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { active = false; window.removeEventListener(AUTH_SESSION_EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);
  const world = JOURNEY_WORLDS[Math.floor((step - 1) / 10)]!;
  const difficulty = journeyDifficulty(step);
  const status = progress.states[step - 1];
  if (!raw) return <p role="status">Yolculuğun yükleniyor…</p>;
  if (step > progress.unlocked && !admin) return <section className={styles.locked}>
    <span aria-hidden="true">♧</span><h1>Bu adım henüz açılmadı.</h1>
    <p>Önce {progress.unlocked}. adımı tamamla. Her keşif bir sonraki kapıyı açar.</p>
    <Link className={styles.primary} href={journeyHref(progress.unlocked)}>Sıradaki adımına git →</Link>
    <Link href="/journey">Haritaya dön</Link>
  </section>;
  const retry = () => {
    retryJourneyStep(step);
    try { window.localStorage.removeItem(hintStorageKey(puzzle, difficulty)); } catch { /* Optional storage. */ }
    setAttempt(value => value + 1);
  };
  return <>
    <header className={styles.stepHeader}><Link href="/journey">← Keşif Yolu</Link><span>ADIM {step} / {JOURNEY_LENGTH}</span></header>
    <aside className={styles.lesson} aria-label="Bu adımın keşif notu">
      <span>{world.symbol} {world.title}</span><p>{JOURNEY_LESSONS[step - 1]}</p>
    </aside>
    <GameBoard key={`${puzzle.id}:${attempt}`} puzzle={puzzle} difficulty={difficulty} />
    {status === "lost" && <div className={styles.finish} role="status"><h2>Bir deneme daha. Bir keşif daha.</h2><p>Haritadaki ilerlemen korunuyor. Bu adımı yeniden deneyebilirsin.</p><button className={styles.primary} onClick={retry}>Bu adımı tekrar dene ↻</button></div>}
    {status === "won" && <section className={styles.finish} aria-label="Adım tamamlandı">
      <div className={styles.celebration} aria-hidden="true">{Array.from({ length: 20 }, (_, i) => <i key={i} style={{ "--angle": `${i * 18}deg`, "--distance": `${90 + i % 4 * 25}px`, "--delay": `${i % 5 * 45}ms`, "--hue": `${35 + i % 4 * 45}` } as CSSProperties} />)}</div>
      <div className={styles.winStars} aria-label={`${progress.stars[step - 1]} yıldız`}>{"★".repeat(progress.stars[step - 1] ?? 0)}</div>
      <h2>{step === JOURNEY_LENGTH ? "200 keşif. Artık bağları görüyorsun." : "Yeni bir yol açıldı."}</h2>
      <p>{step === JOURNEY_LENGTH ? "Keşif Yolu tamamlandı. Şimdi günlük oyunda öğrendiklerini kullan." : `${step + 1}. adım seni bekliyor.`}</p>
      <Link className={styles.primary} href={step < JOURNEY_LENGTH ? journeyHref(step + 1) : "/play?mode=daily"}>{step < JOURNEY_LENGTH ? "Sonraki adımı keşfet →" : "Günlük bulmacaya geç →"}</Link>
      <Link href="/journey">Haritayı gör</Link>
    </section>}
  </>;
}
