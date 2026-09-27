"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";

import { startCinematicCanvas } from "@/animations/cinematicCanvas";
import {
  puzzleIntroScene,
  type PuzzleIntroTheme,
} from "@/animations/puzzleIntroAssets";
import type { GameSoundCue } from "@/components/settings/gameSound";

import styles from "./PuzzleCinematicIntro.module.css";

const EXIT_MS = 460;
const REVEAL_LEAD_MS = 820;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function introCue(theme: PuzzleIntroTheme): GameSoundCue {
  return `intro-${theme}` as GameSoundCue;
}

function revealDelay(index: number): number {
  const order = [0, 5, 10, 15, 3, 6, 9, 12, 1, 4, 11, 14, 2, 7, 8, 13] as const;
  const rank = order.indexOf(index as (typeof order)[number]);
  return Math.max(0, rank) * 26;
}

export type PuzzleCinematicIntroProps = {
  puzzleId: string;
  words: readonly string[];
  soundEnabled: boolean;
  playSound: (cue: GameSoundCue) => void;
  onDone: () => void;
};

export function PuzzleCinematicIntro({
  puzzleId,
  words,
  soundEnabled,
  playSound,
  onDone,
}: PuzzleCinematicIntroProps) {
  const scene = useMemo(() => puzzleIntroScene(puzzleId), [puzzleId]);
  const tiles = useMemo(
    () => Array.from({ length: 16 }, (_, index) => words[index] ?? "QUADRO"),
    [words],
  );
  const [revealing, setRevealing] = useState(false);
  const [exiting, setExiting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const soundPlayedRef = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "test" || prefersReducedMotion()) {
      onDone();
      return;
    }

    const revealAt = Math.max(900, scene.durationMs - REVEAL_LEAD_MS);
    const revealTimer = window.setTimeout(() => setRevealing(true), revealAt);
    const exitTimer = window.setTimeout(() => setExiting(true), scene.durationMs);
    const doneTimer = window.setTimeout(onDone, scene.durationMs + EXIT_MS);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onDone, scene.durationMs]);

  useEffect(() => {
    if (!soundEnabled || soundPlayedRef.current) return;
    soundPlayedRef.current = true;
    playSound(introCue(scene.theme));
  }, [playSound, scene.theme, soundEnabled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || process.env.NODE_ENV === "test" || prefersReducedMotion()) return undefined;
    return startCinematicCanvas(canvas, scene.theme, puzzleId);
  }, [puzzleId, scene.theme]);

  if (process.env.NODE_ENV === "test") return null;

  const overlayStyle = {
    "--q-cinematic-duration": `${scene.durationMs}ms`,
  } as CSSProperties;

  return (
    <div
      className={`${styles.overlay}${revealing ? ` ${styles.revealing}` : ""}${exiting ? ` ${styles.exiting}` : ""}`}
      data-theme={scene.theme}
      style={overlayStyle}
      aria-hidden="true"
    >
      <div className={styles.backdropGlow} />

      <div className={styles.stage}>
        <div className={styles.stageHeader}>
          <div className={styles.brand}>
            <span className={styles.brandDot} />
            <span>QUADRO</span>
            <span className={styles.brandDivider}>/</span>
            <span>#{puzzleId.replace(/\D/g, "") || "01"}</span>
          </div>
          <span className={styles.themeLabel}>{scene.eyebrow}</span>
        </div>

        <div className={styles.mosaic}>
          <canvas ref={canvasRef} className={styles.canvas} />
          <div className={styles.sceneBloom} />
          <div className={styles.lightSweep} />

          <div className={styles.tileGrid}>
            {tiles.map((word, index) => {
              const tileStyle = {
                "--q-tile-delay": `${revealDelay(index)}ms`,
              } as CSSProperties;
              return (
                <div key={`${puzzleId}:${index}`} className={styles.tile} style={tileStyle}>
                  <span className={styles.tileSheen} />
                  <span className={styles.tileNumber}>{String(index + 1).padStart(2, "0")}</span>
                  <span className={styles.tileWord}>{word}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.stageFooter}>
          <div className={styles.copy}>
            <p className={styles.title}>{scene.title}</p>
            <p className={styles.subtitle}>Sahne 16 parçaya ayrılıyor · kelimeler ortaya çıkıyor</p>
          </div>
          <span className={styles.counter}>16 / 4 / 4</span>
        </div>

        <div className={styles.progressTrack}>
          <span className={styles.progressBar} />
        </div>
      </div>
    </div>
  );
}
