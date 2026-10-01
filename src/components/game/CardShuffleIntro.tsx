"use client";

import { useCallback, useEffect, useRef } from "react";
import type { PuzzleCinematicIntroProps } from "./PuzzleCinematicIntro";
import styles from "./CardShuffleIntro.module.css";

import { cardIntroMotion, selectCardIntro, INTRO_CAPTIONS, INTRO_DURATION, INTRO_REVEAL } from "@/animations/cardIntros";

/** Four visual packs use board order, never the hidden answer groups. */
export function CardShuffleIntro({ puzzleId, dayKey, words, onReveal, onDone }: PuzzleCinematicIntroProps & { dayKey?: string }) {
  const variant = selectCardIntro(puzzleId, dayKey);
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const callbacks = useRef({ onReveal, onDone });
  const finished = useRef(false);

  useEffect(() => { callbacks.current = { onReveal, onDone }; }, [onReveal, onDone]);
  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    callbacks.current.onReveal();
    callbacks.current.onDone();
  }, []);

  useEffect(() => {
    const overlay = overlayRef.current;
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (process.env.NODE_ENV === "test" || media?.matches || !overlay || !Element.prototype.animate) {
      finish();
      return;
    }
    const targets = overlay.closest(".q-game-shell")?.querySelectorAll<HTMLElement>(".q-game-board .q-word-tile");
    if (!targets || targets.length !== 16) { finish(); return; }
    const width = window.innerWidth;
    const height = window.innerHeight;

    const animations: Animation[] = [];
    let cancelled = false;
    targets.forEach((target, index) => {
      const card = cardsRef.current[index];
      if (!card) return;
      const rect = target.getBoundingClientRect();
      card.style.width = `${rect.width}px`;
      card.style.height = `${rect.height}px`;
      card.style.fontSize = getComputedStyle(target).fontSize;
      const motion = cardIntroMotion(variant, index, { width, height, target: rect });
      animations.push(card.animate(motion.keyframes, { duration: INTRO_DURATION, delay: motion.delay, fill: "both" }));
    });
    const revealTimer = window.setTimeout(() => {
      callbacks.current.onReveal();
      overlay.dataset.landing = "true";
    }, INTRO_REVEAL);
    const fallback = window.setTimeout(finish, 3150);
    void Promise.all(animations.map((animation) => animation.finished)).then(() => {
      if (!cancelled) finish();
    }).catch(() => { /* Unmount and skip cancel the animation cleanly. */ });
    const stopMotion = () => finish();
    const preventScroll = (event: WheelEvent) => event.preventDefault();
    media?.addEventListener?.("change", stopMotion);
    window.addEventListener("resize", stopMotion);
    overlay.addEventListener("wheel", preventScroll, { passive: false });
    return () => {
      cancelled = true;
      clearTimeout(revealTimer);
      clearTimeout(fallback);
      animations.forEach((animation) => animation.cancel());
      media?.removeEventListener?.("change", stopMotion);
      window.removeEventListener("resize", stopMotion);
      overlay.removeEventListener("wheel", preventScroll);
    };
  }, [finish, variant]);

  if (process.env.NODE_ENV === "test") return null;
  return (
    <div ref={overlayRef} className={styles.overlay} role="region" aria-label="Kartların açılışı" data-intro={variant}>
      <div className={styles.backdrop} />
      <header className={styles.header}>
        <span>QUADRO <small>16 KELİME · 4 GİZLİ BAĞ</small></span>
        <button type="button" onClick={finish}>Oyuna geç ↗</button>
      </header>
      <div className={styles.center} aria-hidden="true"><span>HER ŞEY</span><strong>yerini bulur.</strong></div>
      <div className={styles.cards} aria-hidden="true">
        {Array.from({ length: 16 }, (_, index) => (
          <div className={styles.card} key={index} ref={(card) => { cardsRef.current[index] = card; }}>
            <span className={styles.word}>{words[index] ?? "QUADRO"}</span>
          </div>
        ))}
      </div>
      <footer className={styles.footer}><span>{INTRO_CAPTIONS[variant]}</span><i /><span>BAĞLANTILARI KEŞFET</span></footer>
    </div>
  );
}
