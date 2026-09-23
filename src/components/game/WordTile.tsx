"use client";

import type { WordId } from "@/features/game/contracts";
import type { TileAnimationVerdict } from "@/animations/gameTransitions";

export type WordTileProps = {
  id: WordId;
  text: string;
  selected: boolean;
  disabled?: boolean;
  animation?: TileAnimationVerdict | null;
  onToggle: (wordId: WordId) => void;
};

export function WordTile({
  id,
  text,
  selected,
  disabled = false,
  animation = null,
  onToggle,
}: WordTileProps) {
  return (
    <button
      type="button"
      className="q-word-tile"
      aria-pressed={selected}
      disabled={disabled}
      data-animation={animation ?? undefined}
      onClick={() => onToggle(id)}
    >
      {text}
    </button>
  );
}
