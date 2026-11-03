"use client";
import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore, type CSSProperties } from "react";
import { JOURNEY_LENGTH, JOURNEY_WORLDS, journeyHref } from "@/features/game/journey";
import { emptyJourneySnapshot, journeyProgressSnapshot, subscribeJourney, type JourneyProgress } from "@/lib/persistence/journeyProgress";
import styles from "./Journey.module.css";

const points = Array.from({ length: JOURNEY_LENGTH }, (_, i) => ({ x: [500, 680, 710, 500, 290, 320][i % 6]!, y: 5380 - i * 106 }));
const curve = (count: number) => points.slice(0, count).map((point, i) => {
  if (!i) return `M${point.x},${point.y}`;
  const prev = points[i - 1]!; const middle = (prev.y + point.y) / 2;
  return `C${prev.x},${middle} ${point.x},${middle} ${point.x},${point.y}`;
}).join(" ");

export function JourneyMap() {
  const raw = useSyncExternalStore(subscribeJourney, journeyProgressSnapshot, emptyJourneySnapshot);
  const progress: JourneyProgress = raw ? JSON.parse(raw) : { unlocked: 1, complete: 0, stars: [], states: [] };
  const current = useRef<HTMLAnchorElement>(null);
  const scrolled = useRef(false);
  useEffect(() => {
    if (!raw || scrolled.current) return;
    scrolled.current = true;
    current.current?.scrollIntoView?.({ block: "center", behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [raw]);
  const totalStars = progress.stars.reduce((sum, n) => sum + n, 0);
  return <main className={styles.mapPage}>
    <header className={styles.mapHeader}>
      <Link className={styles.back} href="/play" aria-label="Oyun modlarına dön">↙</Link>
      <div><span className={styles.eyebrow}>QUADRO / KEŞİF YOLU</span><h1>Her adımda bir <em>bağ.</em></h1></div>
      <div className={styles.score}><strong>★ {totalStars}</strong><span>{progress.complete} / 50 keşif</span></div>
    </header>
    <section className={styles.intro} aria-label="Keşif Yolu hakkında">
      <p>Biraz merak. Biraz sezgi. Elli küçük keşif.</p>
      <p>Kolaydan başla. Bağları öğrendikçe yolu aç, kendi hızında ustalaş.</p>
      <Link className={styles.primary} href={journeyHref(progress.unlocked)}>{progress.complete === JOURNEY_LENGTH ? "Son keşfi yeniden gör" : progress.complete ? `${progress.unlocked}. adımdan devam et →` : "İlk keşfine başla →"}</Link>
    </section>
    <div className={styles.map} aria-label="50 adımlık keşif haritası">
      <div className={styles.atlasWorlds} aria-hidden="true">{JOURNEY_WORLDS.slice().reverse().map((world, i) => <div key={world.title} className={styles.atlasZone} style={{ "--zone": i } as CSSProperties} />)}</div>
      <div className={styles.fireflies} aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ left: `${(i * 47) % 100}%`, top: `${(i * 23) % 100}%`, "--delay": `${-i * .7}s` } as CSSProperties} />)}</div>
      <div className={styles.sky} aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
      <svg className={styles.road} viewBox="0 0 1000 5520" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="journey-road" x1="0" y1="1" x2="0" y2="0"><stop stopColor="#f6d287" /><stop offset=".5" stopColor="#faf0c7" /><stop offset="1" stopColor="#d8c6ff" /></linearGradient></defs>
        <path d={curve(JOURNEY_LENGTH)} className={styles.roadShadow} /><path d={curve(JOURNEY_LENGTH)} className={styles.roadBase} />
        <path d={curve(progress.unlocked)} className={styles.roadDone} /><path d={curve(JOURNEY_LENGTH)} className={styles.roadDots} />
      </svg>
      {JOURNEY_WORLDS.map((world, i) => <div key={world.title} className={styles.world} data-tone={i < 2 ? "day" : "night"} style={{ top: `${(5450 - (i * 10 + 4) * 106) / 5520 * 100}%`, left: ["2%", "2%", "75%", "75%", "75%", "2%"][i] }} aria-hidden="true">
        <span className={styles.atlasEmblem}>{world.symbol}</span><strong>{world.title}</strong><small>{world.subtitle}</small>
      </div>)}
      <div className={styles.destination} aria-hidden="true">✧<span>BAĞLANTI USTASI</span></div>
      <ol className={styles.nodes} aria-label="Keşif adımları">
        {points.map((point, i) => {
          const step = i + 1; const won = progress.states[i] === "won"; const unlocked = step <= progress.unlocked;
          const isCurrent = step === progress.unlocked;
          const label = `Adım ${step} · ${JOURNEY_WORLDS[Math.floor(i / 10)]!.title}${won ? ` · ${progress.stars[i]} yıldız` : unlocked ? " · Oynanabilir" : " · Kilitli"}`;
          return <li key={step} className={styles.node} data-state={won ? "won" : isCurrent ? "current" : "locked"}
            style={{ left: `${point.x / 10}%`, top: `${point.y / 55.2}%`, "--delay": `${i % 5 * 65}ms` } as CSSProperties}>
            {unlocked ? <Link ref={isCurrent ? current : undefined} className={styles.medallion} href={journeyHref(step)} prefetch={false} aria-label={label} aria-current={isCurrent ? "step" : undefined}>{won ? <><span className={styles.check}>✓</span><small>{step}</small></> : <>{step}<span className={styles.play}>▶</span></>}</Link> :
              <span className={styles.medallion} role="img" aria-label={label}><small className={styles.lock}><svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden="true"><rect x="1" y="6" width="10" height="7" rx="2" fill="currentColor"/><path d="M3 6V4a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5"/></svg></small>{step}</span>}
            {won ? <span className={styles.stars} aria-hidden="true">{"★".repeat(progress.stars[i] ?? 0)}<span>{"☆".repeat(3 - (progress.stars[i] ?? 0))}</span></span> : isCurrent ? <span className={styles.you}>SIRADAKİ KEŞFİN</span> : null}
          </li>;
        })}
      </ol>
      <div className={styles.startFlag} aria-hidden="true">İLK ADIM, BÜYÜK KEŞİF.</div>
    </div>
    <footer className={styles.mapFooter}><p>Hata yapmak yolun bir parçası. Kaybettiğin adımları yeniden deneyebilirsin.<br />İlerlemen bu tarayıcıda saklanır; depolama kapalıysa yalnız bu ziyaret boyunca korunur.</p><Link href="/play?mode=daily">Günlük bulmacaya dön →</Link></footer>
  </main>;
}
