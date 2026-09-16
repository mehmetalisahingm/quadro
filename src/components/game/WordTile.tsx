"use client";

import type { WordId } from "@/features/game/contracts";

export type WordTileProps = {
  id: WordId;
  text: string;
  selected: boolean;
  disabled?: boolean;
  onToggle: (wordId: WordId) => void;
};

export function WordTile({ id, text, selected, disabled = false, onToggle }: WordTileProps) {
  return (
    <button
      type="button"
      className="q-word-tile"
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onToggle(id)}
    >
      {text}
    </button>
  );
}
