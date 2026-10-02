"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { OpeningScene } from "@/animations/openingScenes";
import { FilmScene, MetroScene, RecordScene } from "./OpeningSceneArt";
import { GAME_OPENINGS, gameOpeningFor } from "@/animations/openingScenes";
import { StoryOpening } from "./StoryOpening";
import { BoardPrelude } from "./BoardPrelude";
import { BaggageScene, DominoScene, ElevatorScene } from "./TravelOpeningArt";
import { ClawScene, NewsroomScene, RedCarpetScene } from "./ShowtimeOpeningArt";
import { ChefScene, DetectiveScene, GameShowScene } from "./DiscoveryOpeningArt";
import styles from "./OpeningPreview.module.css";

const PREVIEW_WORDS = ["DEMO 01", "DEMO 02", "DEMO 03", "DEMO 04", "DEMO 05", "DEMO 06", "DEMO 07", "DEMO 08", "DEMO 09", "DEMO 10", "DEMO 11", "DEMO 12", "DEMO 13", "DEMO 14", "DEMO 15", "DEMO 16"];
const TEST_DAYS = Array.from({ length: GAME_OPENINGS.length }, (_, index) => new Date(Date.UTC(2026, 8, 20 + index)).toISOString().slice(0, 10));
const NEW_SCENES = [
  { id: "chef", title: "Bir tutam merak.", description: "Şefin bıçağı ritim tutar. Kartlar karışır, son vuruşla yerlerine oturur.", button: "Şef mutfağını oynat", Art: ChefScene },
  { id: "detective", title: "Görünenden fazlası var.", description: "Dosya açılır, büyüteç izleri tarar. Her kelime yeni bir bulguya dönüşür.", button: "Dedektif masasını oynat", Art: DetectiveScene },
  { id: "game-show", title: "Hazırsan, başlıyoruz.", description: "Spotlar sahneyi tarar. Üç, iki, bir: kelimeler sahneye çıkar.", button: "TV yarışmasını oynat", Art: GameShowScene },
  { id: "claw", title: "Şansını değil, bağını yakala.", description: "Pençe iner, kartları yakalar. Her bırakışta yeni bir olasılık yerini bulur.", button: "Pençe makinesini oynat", Art: ClawScene },
  { id: "newsroom", title: "Son dakika: bir bağ bulundu.", description: "Yayın açılır, haber bandı akar. Kelimeler birer birer ekrana gelir.", button: "Haber stüdyosunu oynat", Art: NewsroomScene },
  { id: "red-carpet", title: "Bu gecenin yıldızı sensin.", description: "Kırmızı halı serilir. İki yumuşak kamera ışığıyla kartlar sahneye çıkar.", button: "Kırmızı halıyı oynat", Art: RedCarpetScene },
  { id: "domino", title: "Biri başlar, hepsi bağlanır.", description: "Domino taşları sırayla devrilir. Her dokunuş yeni bir kartı açar.", button: "Dominoyu oynat", Art: DominoScene },
  { id: "elevator", title: "Bir üst katta keşif var.", description: "Üç durak, açılan pirinç kapılar. Kartlar her katta tahtaya taşınır.", button: "Asansörü oynat", Art: ElevatorScene },
  { id: "baggage", title: "Kelimelerin yolculuğu.", description: "Bavullar bantta ilerler, tarayıcıdan geçen kartlar yerini bulur.", button: "Bagaj bandını oynat", Art: BaggageScene },
] as const;
const noop = () => {};

export function OpeningPreview() {
  const [active, setActive] = useState<OpeningScene | "board-prelude" | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const play = (scene: OpeningScene | "board-prelude", button: HTMLButtonElement) => {
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
          <div className={styles.poster}><BoardPrelude poster onComplete={noop} /></div>
          <div className={styles.description}><span>PREMIUM / 16 PARÇA <i>00:03</i></span><h2>Her parça bir bütüne ait.</h2><p>Özgün metalik plak birleşir, ışık yüzeyden geçer ve on altı karta ayrılır.</p><button type="button" onClick={(event) => play("board-prelude", event.currentTarget)}>Premium plağı oynat <span aria-hidden="true">↗</span></button></div>
        </article>
        {NEW_SCENES.map(({ id, title, description, button, Art }) => <article key={id} className={styles.scene}>
          <div className={styles.poster}><Art /></div>
          <div className={styles.description}><span>YENİ SAHNE <i>00:03</i></span><h2>{title}</h2><p>{description}</p><button type="button" onClick={(event) => play(id, event.currentTarget)}>{button} <span aria-hidden="true">↗</span></button></div>
        </article>)}
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
      <section className={styles.testDays} aria-label="Arka arkaya on dokuz test oyunu">
        <span>19 OYUNU SIRAYLA DENE</span>
        <div>{TEST_DAYS.map((day, index) => <Link key={day} href={`/play?day=${day}`}><small>{String(index + 1).padStart(2, "0")}</small><b>{day.slice(5)}</b><i>{gameOpeningFor(`q-${index + 1}`, day)}</i></Link>)}</div>
      </section>
      <footer className={styles.footer}><span>Her açılışta aynı oyun. Farklı bir ilk sahne.</span><button type="button" onClick={(event) => play("four-corners", event.currentTarget)}>Dört köşeyi oynat ↗</button></footer>
      {active === "board-prelude" ? <BoardPrelude onComplete={finish} /> : active ? <StoryOpening key={active} scene={active} words={PREVIEW_WORDS} onComplete={finish} /> : null}
    </main>
  );
}
