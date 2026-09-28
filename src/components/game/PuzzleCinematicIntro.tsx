"use client";

import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { startCinematicCanvas } from "@/animations/cinematicCanvas";
import { puzzleIntroScene, type PuzzleIntroTheme } from "@/animations/puzzleIntroAssets";
import type { GameSoundCue } from "@/components/settings/gameSound";
import styles from "./PuzzleCinematicIntro.module.css";

function introCue(theme: PuzzleIntroTheme): GameSoundCue {
  return `intro-${theme}` as GameSoundCue;
}

export type PuzzleCinematicIntroProps = {
  puzzleId: string;
  words: readonly string[];
  soundEnabled: boolean;
  playSound: (cue: GameSoundCue) => void;
  onReveal: () => void;
  onDone: () => void;
};

export function PuzzleCinematicIntro({
  puzzleId, words, soundEnabled, playSound, onReveal, onDone,
}: PuzzleCinematicIntroProps) {
  const scene = useMemo(() => puzzleIntroScene(puzzleId), [puzzleId]);
  const tiles = useMemo(() => Array.from({ length: 16 }, (_, index) => words[index] ?? "QUADRO"), [words]);
  const [revealing, setRevealing] = useState(false);
  const [exiting, setExiting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mosaicRef = useRef<HTMLDivElement>(null);
  const fragmentsRef = useRef<(HTMLCanvasElement | null)[]>([]);
  const soundPlayedRef = useRef(false);
  const revealSentRef = useRef(false);
  const doneSentRef = useRef(false);
  const callbacksRef = useRef({ onReveal, onDone });

  useEffect(() => { callbacksRef.current = { onReveal, onDone }; }, [onReveal, onDone]);

  const reveal = useCallback(() => {
    if (revealSentRef.current) return;
    revealSentRef.current = true;
    callbacksRef.current.onReveal();
  }, []);

  const finish = useCallback(() => {
    if (doneSentRef.current) return;
    doneSentRef.current = true;
    reveal();
    callbacksRef.current.onDone();
  }, [reveal]);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (process.env.NODE_ENV === "test" || media?.matches) {
      finish();
      return;
    }
    const revealTimer = window.setTimeout(() => {
      setRevealing(true);
      reveal();
    }, scene.durationMs - 1580);
    const exitTimer = window.setTimeout(() => {
      // Land the same sixteen image fragments on the actual playing surface.
      const mosaic = mosaicRef.current;
      const board = mosaic?.closest(".q-game-shell")?.querySelector(".q-game-board");
      if (mosaic && board) {
        const source = mosaic.getBoundingClientRect();
        const target = board.getBoundingClientRect();
        if (source.width && source.height && target.width && target.height) {
          mosaic.style.setProperty("--handoff-x", `${target.left - source.left}px`);
          mosaic.style.setProperty("--handoff-y", `${target.top - source.top}px`);
          mosaic.style.setProperty("--handoff-scale-x", `${target.width / source.width}`);
          mosaic.style.setProperty("--handoff-scale-y", `${target.height / source.height}`);
        }
      }
      setExiting(true);
    }, scene.durationMs - 680);
    const doneTimer = window.setTimeout(finish, scene.durationMs);
    const preferenceChange = (event: MediaQueryListEvent) => { if (event.matches) finish(); };
    media?.addEventListener?.("change", preferenceChange);
    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
      media?.removeEventListener?.("change", preferenceChange);
    };
  }, [finish, reveal, scene.durationMs]);

  useEffect(() => {
    if (!soundEnabled || soundPlayedRef.current || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    soundPlayedRef.current = true;
    playSound(introCue(scene.theme));
  }, [playSound, scene.theme, soundEnabled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || process.env.NODE_ENV === "test" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const fragments = fragmentsRef.current.map((fragment) => ({
      canvas: fragment, context: fragment?.getContext("2d", { alpha: false }),
    }));
    return startCinematicCanvas(canvas, scene.theme, puzzleId, (source) => {
      fragments.forEach(({ canvas: fragment, context }, index) => {
        if (!fragment || !context) return;
        const x = Math.round((index % 4) * source.width / 4);
        const y = Math.round(Math.floor(index / 4) * source.height / 4);
        const width = Math.round(((index % 4) + 1) * source.width / 4) - x;
        const height = Math.round((Math.floor(index / 4) + 1) * source.height / 4) - y;
        if (fragment.width !== width) fragment.width = width;
        if (fragment.height !== height) fragment.height = height;
        context.drawImage(source, x, y, width, height, 0, 0, width, height);
      });
    });
  }, [puzzleId, scene.theme]);

  if (process.env.NODE_ENV === "test") return null;

  return (
    <div className={`${styles.overlay}${revealing ? ` ${styles.revealing}` : ""}${exiting ? ` ${styles.exiting}` : ""}`}
      data-theme={scene.theme} style={{ "--q-cinematic-duration": `${scene.durationMs}ms` } as CSSProperties}
      role="region" aria-label="Oyun açılışı">
      <div className={styles.ambience} aria-hidden="true" />
      <div className={styles.stage}>
        <div className={styles.stageHeader}>
          <span className={styles.brand}><i aria-hidden="true" />QUADRO<span>GÜNLÜK KEŞİF</span></span>
          <button className={styles.skip} onClick={finish} type="button">Oyuna geç <span aria-hidden="true">↗</span></button>
        </div>
        <div ref={mosaicRef} className={styles.mosaic} aria-hidden="true">
          <canvas ref={canvasRef} className={styles.sourceCanvas} />
          <div className={styles.tileGrid}>
            {tiles.map((word, index) => (
              <div key={`${puzzleId}:${index}`} className={styles.tile}
                style={{ "--q-tile-delay": `${((index % 4) + Math.floor(index / 4)) * 22}ms` } as CSSProperties}>
                <canvas ref={(element) => { fragmentsRef.current[index] = element; }} className={styles.fragment} />
                <span className={styles.tileWord}>{word}</span>
              </div>
            ))}
          </div>
          <div className={styles.sceneLabel}><span>{scene.eyebrow}</span><span>16 KELİME · 4 GİZLİ BAĞ</span></div>
        </div>
        <div className={styles.stageFooter}>
          <p>{scene.title}</p><span className={styles.edition}>#{puzzleId.replace(/\D/g, "") || "01"}</span>
        </div>
        <div className={styles.progressTrack} aria-hidden="true"><span /></div>
      </div>
    </div>
  );
}
