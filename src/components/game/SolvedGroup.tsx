import type { PuzzleGroup } from "@/features/game/contracts";

import motionStyles from "./GameAnimations.module.css";
import { PictureStrip } from "./PictureStrip";

export type SolvedGroupProps = {
  group: PuzzleGroup;
  entering?: boolean;
};

export function SolvedGroup({ group, entering = false }: SolvedGroupProps) {
  return (
    <article
      className={`q-solved-group${entering ? ` ${motionStyles.groupEntering}` : ""}`}
      data-difficulty={group.difficulty}
      data-entering={entering ? "true" : undefined}
      aria-label={`Çözülen grup: ${group.title}`}
    >
      <strong className="q-solved-title">{group.title}</strong>
      {group.words[0].image ? <PictureStrip words={group.words} /> : null}
      <span className="q-solved-words">
        {group.words.map((word) => word.text).join(" · ")}
      </span>
    </article>
  );
}
