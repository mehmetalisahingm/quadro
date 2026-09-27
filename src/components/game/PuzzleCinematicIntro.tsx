"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";

import {
  puzzleIntroScene,
  type PuzzleIntroTheme,
} from "@/animations/puzzleIntroAssets";
import type { GameSoundCue } from "@/components/settings/gameSound";

import styles from "./PuzzleCinematicIntro.module.css";

const LOTTIE_CDN = "https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.13.0/lottie_svg.min.js";
const EXIT_MS = 520;

type LottieAnimationItem = {
  destroy: () => void;
};

type LottieApi = {
  loadAnimation: (options: {
    container: Element;
    renderer: "svg";
    loop: boolean;
    autoplay: boolean;
    animationData: Record<string, unknown>;
    rendererSettings?: {
      preserveAspectRatio?: string;
      progressiveLoad?: boolean;
    };
  }) => LottieAnimationItem;
};

type LottieWindow = Window & {
  lottie?: LottieApi;
};

let loaderPromise: Promise<LottieApi | null> | null = null;

function loadLottieRuntime(): Promise<LottieApi | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const lottieWindow = window as LottieWindow;
  if (lottieWindow.lottie) return Promise.resolve(lottieWindow.lottie);
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve) => {
    const finish = () => resolve((window as LottieWindow).lottie ?? null);
    const existing = document.querySelector<HTMLScriptElement>("script[data-quadro-lottie]");

    if (existing) {
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", () => resolve(null), { once: true });
      window.setTimeout(finish, 2200);
      return;
    }

    const script = document.createElement("script");
    script.src = LOTTIE_CDN;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.quadroLottie = "true";
    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", () => resolve(null), { once: true });
    document.head.appendChild(script);
    window.setTimeout(finish, 2200);
  });

  return loaderPromise;
}

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

export type PuzzleCinematicIntroProps = {
  puzzleId: string;
  soundEnabled: boolean;
  playSound: (cue: GameSoundCue) => void;
  onDone: () => void;
};

export function PuzzleCinematicIntro({
  puzzleId,
  soundEnabled,
  playSound,
  onDone,
}: PuzzleCinematicIntroProps) {
  const scene = useMemo(() => puzzleIntroScene(puzzleId), [puzzleId]);
  const [exiting, setExiting] = useState(false);
  const lottieContainerRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<LottieAnimationItem | null>(null);
  const soundPlayedRef = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "test" || prefersReducedMotion()) {
      onDone();
      return;
    }

    const exitTimer = window.setTimeout(() => setExiting(true), scene.durationMs);
    const doneTimer = window.setTimeout(onDone, scene.durationMs + EXIT_MS);

    return () => {
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
    if (process.env.NODE_ENV === "test") return;
    let cancelled = false;

    void loadLottieRuntime().then((lottie) => {
      if (cancelled || !lottie || !lottieContainerRef.current) return;
      animationRef.current?.destroy();
      animationRef.current = lottie.loadAnimation({
        container: lottieContainerRef.current,
        renderer: "svg",
        loop: false,
        autoplay: true,
        animationData: scene.animationData,
        rendererSettings: {
          preserveAspectRatio: "xMidYMid slice",
          progressiveLoad: true,
        },
      });
    });

    return () => {
      cancelled = true;
      animationRef.current?.destroy();
      animationRef.current = null;
    };
  }, [scene]);

  if (process.env.NODE_ENV === "test") return null;

  const style = {
    "--q-cinematic-duration": `${scene.durationMs}ms`,
  } as CSSProperties;

  return (
    <div
      className={`${styles.overlay}${exiting ? ` ${styles.exiting}` : ""}`}
      data-theme={scene.theme}
      style={style}
      aria-hidden="true"
    >
      <div className={styles.fallbackOrb} />
      <div className={styles.sceneFrame}>
        <div ref={lottieContainerRef} className={styles.lottie} />
        <div className={styles.lightSweep} />
      </div>

      <div className={styles.brand}>
        <span className={styles.brandDot} />
        QUADRO // #{puzzleId.replace(/\D/g, "") || "01"}
      </div>

      <div className={styles.copy}>
        <p className={styles.eyebrow}>{scene.eyebrow}</p>
        <p className={styles.title}>{scene.title}</p>
        <p className={styles.subtitle}>16 kelime hazırlanıyor · bağlantıları yakala</p>
      </div>

      <div className={styles.progressTrack}>
        <span className={styles.progressBar} />
      </div>
    </div>
  );
}
