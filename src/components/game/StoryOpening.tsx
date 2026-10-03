"use client";

import { useCallback, useEffect, useMemo, useRef, type CSSProperties } from "react";
import type { Puzzle } from "@/features/game/contracts";
import { OPENING_COPY, OPENING_DURATION, openingCardFrames, openingSceneFor, openingWords, type OpeningScene } from "@/animations/openingScenes";
import { FilmScene, MetroScene, RecordScene } from "./OpeningSceneArt";
import { BaggageScene, DominoScene, ElevatorScene } from "./TravelOpeningArt";
import { ClawScene, NewsroomScene, RedCarpetScene } from "./ShowtimeOpeningArt";
import { ChefScene, DetectiveScene, GameShowScene } from "./DiscoveryOpeningArt";
import { SunriseScene, SunsetScene, SnowScene, RacingScene } from "./FinalOpeningArt";
import styles from "./StoryOpening.module.css";

export function PuzzleOpening({ puzzle, onComplete }: { puzzle: Puzzle; onComplete: () => void }) {
  const words = useMemo(() => openingWords(puzzle), [puzzle]);
  return <StoryOpening scene={openingSceneFor(puzzle.id, puzzle.date)} words={words} onComplete={onComplete} />;
}

export function StoryOpening({ scene, words, onComplete, onReveal }: {
  scene: OpeningScene;
  words: readonly string[];
  onComplete: () => void;
  onReveal?: () => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const callbackRef = useRef(onComplete);
  const revealRef = useRef(onReveal);
  const finishedRef = useRef(false);
  const copy = OPENING_COPY[scene];
  useEffect(() => { callbackRef.current = onComplete; }, [onComplete]);
  useEffect(() => { revealRef.current = onReveal; }, [onReveal]);
  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    revealRef.current?.();
    callbackRef.current();
  }, []);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const timer = window.setTimeout(finish, media?.matches ? 0 : OPENING_DURATION + 120);
    const revealTimer = window.setTimeout(() => revealRef.current?.(), OPENING_DURATION - 350);
    const preferenceChange = () => { if (media?.matches) finish(); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    skipRef.current?.focus({ preventScroll: true });
    media?.addEventListener?.("change", preferenceChange);
    window.addEventListener("resize", finish);
    const stage = stageRef.current;
    const animations: Animation[] = [];
    if (stage && !media?.matches) {
      const bounds = stage.getBoundingClientRect();
      const cards = Array.from(stage.querySelectorAll<HTMLElement>("[data-opening-card]"));
      const geometry = cards.map((card) => ({ card, rect: card.getBoundingClientRect() }));
      geometry.forEach(({ card, rect }, index) => {
        if (typeof card.animate !== "function") {
          card.style.opacity = "1";
          return;
        }
        animations.push(card.animate(openingCardFrames(scene, index, {
          x: rect.left - bounds.left, y: rect.top - bounds.top, width: rect.width, height: rect.height,
        }, bounds).map((frame) => ({ ...frame, easing: "cubic-bezier(.22, 1, .36, 1)" })), {
          duration: OPENING_DURATION - 180,
          delay: (index % 4) * 24,
          easing: "linear",
          fill: "both",
        }));
      });
    }
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(revealTimer);
      animations.forEach((animation) => animation.cancel());
      document.body.style.overflow = previousOverflow;
      media?.removeEventListener?.("change", preferenceChange);
      window.removeEventListener("resize", finish);
    };
  }, [finish, scene]);

  return (
    <section className={styles.opening} data-opening={scene} aria-label="Oyun açılışı"
      style={{ "--opening-duration": `${OPENING_DURATION}ms` } as CSSProperties}
      onAnimationEnd={(event) => { if (event.target === event.currentTarget) finish(); }}
      onKeyDown={(event) => {
        if (event.key === "Escape") finish();
        if (event.key === "Tab") { event.preventDefault(); skipRef.current?.focus(); }
      }}>
      <header className={styles.header}>
        <span className={styles.brand}>QUADRO <i /> <small>GÜNLÜK KEŞİF</small></span>
        <button type="button" ref={skipRef} className={styles.skip} onClick={finish}>Oyuna geç <span aria-hidden="true">↗</span></button>
      </header>
      <div className={styles.introCopy}><span>{copy.kicker}</span><h2>{copy.title}</h2></div>
      <div ref={stageRef} className={styles.stage} aria-hidden="true">
        {scene === "sunrise" ? <SunriseScene /> : scene === "sunset" ? <SunsetScene /> : scene === "snow" ? <SnowScene /> : scene === "racing" ? <RacingScene /> : scene === "chef" ? <ChefScene /> : scene === "detective" ? <DetectiveScene /> : scene === "game-show" ? <GameShowScene /> : scene === "metro" ? <MetroScene /> : scene === "film" ? <FilmScene /> : scene === "record" ? <RecordScene /> : scene === "domino" ? <DominoScene /> : scene === "elevator" ? <ElevatorScene /> : scene === "baggage" ? <BaggageScene /> : scene === "claw" ? <ClawScene /> : scene === "newsroom" ? <NewsroomScene /> : scene === "red-carpet" ? <RedCarpetScene /> : <div className={styles.cornerBackdrop}><i /><span>16 / 04</span></div>}
        <div className={styles.cardGrid}>
          {Array.from({ length: 16 }, (_, index) => (
            <div key={index} className={styles.card} data-opening-card={index}>
              <small>{String(index + 1).padStart(2, "0")}</small><span>{words[index] ?? "QUADRO"}</span><i />
            </div>
          ))}
        </div>
      </div>
      <footer className={styles.footer}><span>{copy.detail}</span><div className={styles.progress}><i /></div><small>16 KELİME · 4 GİZLİ BAĞ</small></footer>
    </section>
  );
}
