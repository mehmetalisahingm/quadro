"use client";

import { memo, useEffect, useRef, type CSSProperties } from "react";
import { GAME_OPENINGS, OPENING_SCENES, type OpeningScene } from "@/animations/openingScenes";
import { OpeningArtwork } from "./StoryOpening";
import { BoardPrelude } from "./BoardPrelude";
import styles from "./GameBackdrop.module.css";

const noop = () => undefined;
type Scene = typeof GAME_OPENINGS[number];

/** Decoration only: no focus, game timers, answer text or pointer events. */
export const GameBackdrop = memo(function GameBackdrop({ scene }: { scene: Scene }) {
  const art = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = art.current;
    if (!root?.getAnimations) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const settle = () => {
      // Keep one-shot scenery at its visible middle instead of its faded exit.
      // Existing infinite loops (record rotation, snow, lights) continue naturally.
      for (const animation of root.getAnimations({ subtree: true })) {
        const timing = animation.effect?.getTiming();
        if (!timing || timing.iterations === Infinity) continue;
        animation.pause();
        animation.currentTime = (timing.delay ?? 0) + Number(timing.duration) * .42;
      }
    };
    settle();
    media.addEventListener("change", settle);
    return () => media.removeEventListener("change", settle);
  }, [scene]);

  const story = (OPENING_SCENES as readonly string[]).includes(scene) && scene !== "four-corners";
  return <div className={styles.backdrop} data-game-background={scene} aria-hidden="true" inert>
    <div className={styles.motion}>
      <div ref={art} className={`${styles.art} ${scene === "board-prelude" ? styles.plaque : ""}`}>
        {scene === "board-prelude" ? <BoardPrelude poster onComplete={noop} /> : story ?
          <OpeningArtwork scene={scene as OpeningScene} /> :
          <div className={styles.cards} data-card-scene={scene}>{Array.from({ length: 16 }, (_, i) =>
            <i key={i} style={{ "--i": i, "--angle": `${(i % 4 - 1.5) * 12}deg` } as CSSProperties} />
          )}</div>}
      </div>
    </div>
    <div className={styles.veil} />
  </div>;
});
