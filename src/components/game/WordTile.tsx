"use client";

import { type CSSProperties, useMemo, useState } from "react";

import type { TileAnimationVerdict } from "@/animations/gameTransitions";
import type { WordId } from "@/features/game/contracts";

import motionStyles from "./GameAnimations.module.css";

export type WordTileProps = {
  id: WordId;
  text: string;
  selected: boolean;
  disabled?: boolean;
  animation?: TileAnimationVerdict | null;
  onToggle: (wordId: WordId) => void;
};

type IntroMotion = {
  x: number;
  y: number;
  rotate: number;
  delay: number;
};

function introMotionFor(id: string): IntroMotion {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  const unsigned = hash >>> 0;
  const x = ((unsigned & 0xff) / 255) * 96 - 48;
  const y = (((unsigned >>> 8) & 0xff) / 255) * 72 - 36;
  const rotate = (((unsigned >>> 16) & 0xff) / 255) * 14 - 7;
  const delay = ((unsigned >>> 24) & 0x0f) * 24;

  return { x, y, rotate, delay };
}

export function WordTile({
  id,
  text,
  selected,
  disabled = false,
  animation = null,
  onToggle,
}: WordTileProps) {
  const [isEntering, setIsEntering] = useState(true);
  const introMotion = useMemo(() => introMotionFor(id), [id]);

  const animationClass =
    animation === "wrong"
      ? motionStyles.tileWrong
      : animation === "one-away"
        ? motionStyles.tileOneAway
        : "";

  const introStyle = {
    "--q-intro-x": `${introMotion.x.toFixed(1)}px`,
    "--q-intro-y": `${introMotion.y.toFixed(1)}px`,
    "--q-intro-rotate": `${introMotion.rotate.toFixed(1)}deg`,
    "--q-intro-delay": `${introMotion.delay}ms`,
  } as CSSProperties;

  return (
    <button
      type="button"
      className={`q-word-tile${isEntering ? ` ${motionStyles.tileEntering}` : ""}${animationClass ? ` ${animationClass}` : ""}`}
      style={isEntering ? introStyle : undefined}
      aria-pressed={selected}
      disabled={disabled}
      data-animation={animation ?? undefined}
      onAnimationEnd={() => setIsEntering(false)}
      onClick={() => onToggle(id)}
    >
      {text}
    </button>
  );
}
