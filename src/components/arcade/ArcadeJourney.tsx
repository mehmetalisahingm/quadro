"use client";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { JOURNEY_LENGTH, JOURNEY_WORLDS, journeyHref } from "@/features/game/journey";
import { emptyJourneySnapshot, journeyProgressSnapshot, subscribeJourney, type JourneyProgress } from "@/lib/persistence/journeyProgress";
import { ArcadeShell, ArcadeTitle } from "./ArcadeShell";
import hub from "./ArcadeHub.module.css";
import styles from "./ArcadeJourney.module.css";

const positions = [20, 39, 62, 78, 60, 38, 22, 40, 64, 78];
export function ArcadeJourney() {
  const raw = useSyncExternalStore(subscribeJourney, journeyProgressSnapshot, emptyJourneySnapshot);
  const progress: JourneyProgress = raw ? JSON.parse(raw) : { unlocked: 1, complete: 0, stars: [], states: [] };
  const [chosen, setChosen] = useState<number | null>(null);
  const currentWorld = Math.min(JOURNEY_WORLDS.length - 1, Math.floor((progress.unlocked - 1) / 10));
  const index = chosen ?? currentWorld;
  const world = JOURNEY_WORLDS[index]!;
  const start = index * 10;
  const stars = progress.stars.slice(start, start + 10).reduce((sum, n) => sum + n, 0);
  const complete = progress.states.slice(start, start + 10).filter((state) => state === "won").length;
  return <ArcadeShell active="play">
    <ArcadeTitle eyebrow="HER ADIMDA YENİ BİR BAĞ" title="🧭 Keşif Yolu" description="Bölümleri tamamla, yeni dünyaları keşfet!" />
    <section className={hub.panel} aria-label="Yolculuk ilerlemen"><div className={hub.titleRow}><div><span className={hub.eyebrow}>DÜNYA {index + 1} / {JOURNEY_WORLDS.length}</span><h2>{world.title}</h2><p>{world.subtitle}</p></div><strong>★ {raw ? stars : "—"} / 30</strong></div><div className={hub.bar}><span style={{width:`${complete * 10}%`}} /></div><p>{raw ? `${complete} / 10 adım tamamlandı` : "İlerlemen yükleniyor…"}</p></section>
    <nav className={styles.worlds} aria-label="Dünyalar">{JOURNEY_WORLDS.map((item, i) => <button type="button" key={item.title} aria-current={i === index ? "true" : undefined} onClick={() => setChosen(i)}><span>{item.symbol}</span><strong>{i + 1}. Dünya</strong><small>{item.title}</small></button>)}</nav>
    <section className={styles.map} style={{backgroundImage:`linear-gradient(180deg,#041d3890,#032d4499),url(/images/journey/${world.image})`}} aria-label={`${world.title} adımları`}>
      <div className={styles.mapHeading}><span>✦ DÜNYA {index + 1}</span><h2>{world.title}</h2><p>{world.subtitle}</p></div>
      <svg className={styles.path} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M20 89 C30 89 29 80 39 80 S62 71 62 71 S78 62 78 62 S60 53 60 53 S38 44 38 44 S22 35 22 35 S40 26 40 26 S64 17 64 17 S78 8 78 8" /></svg>
      {positions.map((x, i) => { const step = start + i + 1; const unlocked = step <= progress.unlocked; const won = progress.states[step - 1] === "won"; const label = `Adım ${step} · ${world.title}${won ? ` · ${progress.stars[step - 1]} yıldız` : unlocked ? " · Oynanabilir" : " · Kilitli"}`; const className = `${styles.step} ${won ? styles.won : ""} ${step === progress.unlocked ? styles.current : ""}`; const style = {left:`${x}%`, top:`${89 - i * 9}%`}; return unlocked ? <Link href={journeyHref(step)} key={step} className={className} style={style} aria-label={label}>{won ? "✓" : step}</Link> : <span key={step} className={className} style={style} aria-label={label}>🔒</span>; })}
    </section>
    <section className={hub.panel}><div className={hub.titleRow}><div><span className={hub.eyebrow}>BÜYÜK YOLCULUK</span><h2>{progress.complete} / {JOURNEY_LENGTH} adım</h2><p>Her çözdüğün bulmaca seni biraz daha ileri taşır.</p></div><Link className={hub.button} href={journeyHref(progress.unlocked)}>▶ Devam Et</Link></div></section>
  </ArcadeShell>;
}
