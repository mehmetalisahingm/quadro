"use client";

import type { TileAnimationVerdict } from "@/animations/gameTransitions";
import type { WordId } from "@/features/game/contracts";

import motionStyles from "./GameAnimations.module.css";

export type WordTileProps = {
  id: WordId;
  text: string;
  ariaLabel?: string;
  selected: boolean;
  disabled?: boolean;
  animation?: TileAnimationVerdict | null;
  onToggle: (wordId: WordId) => void;
};

export function WordTile({
  id,
  text,
  ariaLabel,
  selected,
  disabled = false,
  animation = null,
  onToggle,
}: WordTileProps) {
  const animationClass =
    animation === "wrong"
      ? motionStyles.tileWrong
      : animation === "one-away"
        ? motionStyles.tileOneAway
        : "";

  return (
    <button
      type="button"
      className={`q-word-tile${animationClass ? ` ${animationClass}` : ""}`}
      aria-pressed={selected}
      aria-label={ariaLabel}
      disabled={disabled}
      data-animation={animation ?? undefined}
      onClick={() => onToggle(id)}
    >
      {text}
    </button>
  );
}
