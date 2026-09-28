"use client";

import { useCallback, useEffect, useRef } from "react";
import type { PuzzleCinematicIntroProps } from "./PuzzleCinematicIntro";
import styles from "./CardShuffleIntro.module.css";

const DURATION = 2700;

/** Four visual packs use board order, never the hidden answer groups. */
export function CardShuffleIntro({ puzzleId, words, onReveal, onDone }: PuzzleCinematicIntroProps) {
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
    const variant = (Number(puzzleId.match(/\d+/)?.[0]) || 0) % 3;
    const animations: Animation[] = [];
    let cancelled = false;
    const transform = (x: number, y: number, angle: number, scale: number) =>
      `translate3d(${x}px, ${y}px, 0) rotate(${angle}deg) scale(${scale})`;
    const easing = "cubic-bezier(.45, 0, .2, 1)";

    targets.forEach((target, index) => {
      const card = cardsRef.current[index];
      if (!card) return;
      const rect = target.getBoundingClientRect();
      const pack = Math.floor(index / 4);
      const rank = index % 4;
      const right = pack % 2 === 1;
      const bottom = pack > 1;
      const sx = right ? 1 : -1;
      const sy = bottom ? 1 : -1;
      const cornerX = right ? width - rect.width - 28 - rank * 9 : 28 + rank * 9;
      const cornerY = bottom ? height - rect.height - 80 - rank * 8 : 90 + rank * 8;
      const cx = (width - rect.width) / 2;
      const cy = (height - rect.height) / 2;
      const angle = index * Math.PI / 8 + variant * .6;
      const mixX = variant === 1 ? Math.cos(angle) * width * .23 : sx * (rank - 1.5) * Math.min(65, width * .13);
      const mixY = variant === 2 ? Math.sin(angle) * height * .18 : sy * (rank - 1.5) * 32;
      const gridWidth = Math.min(width - 40, 920);
      const gridHeight = Math.min(height * .5, 460);
      const gridX = (width - gridWidth) / 2 + (index % 4 + .5) * gridWidth / 4 - rect.width / 2;
      const gridY = (height - gridHeight) / 2 + (Math.floor(index / 4) + .5) * gridHeight / 4 - rect.height / 2;
      const largeScale = Math.min(1.3, (gridWidth / 4 - 9) / rect.width);
      card.style.width = `${rect.width}px`;
      card.style.height = `${rect.height}px`;
      card.style.fontSize = getComputedStyle(target).fontSize;
      animations.push(card.animate([
        { offset: 0, transform: transform(cornerX + sx * width * .3, cornerY + sy * height * .3, sx * 35, 1.1), opacity: 0, easing },
        { offset: .23, transform: transform(cornerX, cornerY, sx * (rank - 1.5) * 9, 1.08), opacity: 1, easing },
        { offset: .52, transform: transform(cx + mixX, cy + mixY, (rank - 1.5) * 17 + sx * 7, 1.12), opacity: 1, easing },
        { offset: .76, transform: transform(gridX, gridY, 0, largeScale), opacity: 1, easing },
        { offset: 1, transform: transform(rect.left, rect.top, 0, 1), opacity: 1 },
      ], { duration: DURATION, delay: rank * 35 + pack * 35, fill: "both" }));
    });
    const revealTimer = window.setTimeout(() => {
      callbacks.current.onReveal();
      overlay.dataset.landing = "true";
    }, 2050);
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
  }, [finish, puzzleId]);

  if (process.env.NODE_ENV === "test") return null;
  return (
    <div ref={overlayRef} className={styles.overlay} role="region" aria-label="Kartların dört köşeden açılışı">
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
      <footer className={styles.footer}><span>DÖRT KÖŞE. TEK TAHTA.</span><i /><span>BAĞLANTILARI KEŞFET</span></footer>
    </div>
  );
}
