"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { OpeningScene } from "@/animations/openingScenes";
import { FilmScene, MetroScene, RecordScene } from "./OpeningSceneArt";
import { gameOpeningFor } from "@/animations/openingScenes";
import { StoryOpening } from "./StoryOpening";
import styles from "./OpeningPreview.module.css";

const PREVIEW_WORDS = ["DEMO 01", "DEMO 02", "DEMO 03", "DEMO 04", "DEMO 05", "DEMO 06", "DEMO 07", "DEMO 08", "DEMO 09", "DEMO 10", "DEMO 11", "DEMO 12", "DEMO 13", "DEMO 14", "DEMO 15", "DEMO 16"];
const TEST_DAYS = Array.from({ length: 10 }, (_, index) => `2026-09-${String(20 + index).padStart(2, "0")}`);

export function OpeningPreview() {
  const [active, setActive] = useState<OpeningScene | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const play = (scene: OpeningScene, button: HTMLButtonElement) => {
    triggerRef.current = button;
    setActive(scene);
  };
  const finish = () => {
    setActive(null);
    requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
  };
  return (
    <main className={styles.page}>
      <header className={styles.header}><Link href="/">QUADRO</Link><Link href="/play">Oyuna dön ↗</Link></header>
      <div className={styles.heading}><span>KÜÇÜK SAHNELER, YENİ BAŞLANGIÇLAR</span><h1>Her gün başka<br />bir <em>hikâye.</em></h1><p>Bir tren yolculuğu. Bir film seti.<br />On altı kelimenin sahneye çıkma zamanı.</p></div>
      <div className={styles.scenes}>
        <article className={styles.scene}>
          <div className={styles.poster}><MetroScene /></div>
          <div className={styles.description}><span>01 / ŞEHİR HATLARI <i>00:03</i></span><h2>Sonraki durak: keşif.</h2><p>Tren gelir, kapılar açılır. Kartlar perondan tahtaya doğru yola çıkar.</p><button type="button" onClick={(event) => play("metro", event.currentTarget)}>Metro peronunu oynat <span aria-hidden="true">↗</span></button></div>
        </article>
        <article className={`${styles.scene} ${styles.film}`}>
          <div className={styles.poster}><FilmScene /></div>
          <div className={styles.description}><span>02 / QUADRO PICTURES <i>00:03</i></span><h2>Motor. Kayıt. Sen.</h2><p>Klaket kapanır, ışıklar açılır. Kartlar yerini alır ve oyun başlar.</p><button type="button" onClick={(event) => play("film", event.currentTarget)}>Film setini oynat <span aria-hidden="true">↗</span></button></div>
        </article>
        <article className={styles.scene}>
          <div className={styles.poster}><RecordScene /></div>
          <div className={styles.description}><span>03 / SES ARŞİVİ <i>00:03</i></span><h2>Bağlantının ritmi.</h2><p>Plak döner, iğne iner. Kartlar müziğin ritmiyle tahtaya akar.</p><button type="button" onClick={(event) => play("record", event.currentTarget)}>Plağı oynat <span aria-hidden="true">↗</span></button></div>
        </article>
      </div>
      <section className={styles.testDays} aria-label="Arka arkaya on test oyunu">
        <span>10 OYUNU SIRAYLA DENE</span>
        <div>{TEST_DAYS.map((day, index) => <Link key={day} href={`/play?day=${day}`}><small>{String(index + 1).padStart(2, "0")}</small><b>{day.slice(5)}</b><i>{gameOpeningFor(`q-${index + 1}`, day)}</i></Link>)}</div>
      </section>
      <footer className={styles.footer}><span>Her açılışta aynı oyun. Farklı bir ilk sahne.</span><button type="button" onClick={(event) => play("four-corners", event.currentTarget)}>Dört köşeyi oynat ↗</button></footer>
      {active ? <StoryOpening key={active} scene={active} words={PREVIEW_WORDS} onComplete={finish} /> : null}
    </main>
  );
}
