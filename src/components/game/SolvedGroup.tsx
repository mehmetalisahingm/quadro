import type { PuzzleGroup } from "@/features/game/contracts";

export type SolvedGroupProps = {
  group: PuzzleGroup;
};

export function SolvedGroup({ group }: SolvedGroupProps) {
  return (
    <article
      className="q-solved-group"
      data-difficulty={group.difficulty}
      aria-label={`Çözülen grup: ${group.title}`}
    >
      <strong className="q-solved-title">{group.title}</strong>
      <span className="q-solved-words">
        {group.words.map((word) => word.text).join(" · ")}
      </span>
    </article>
  );
}
