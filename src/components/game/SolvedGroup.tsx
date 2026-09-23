import type { PuzzleGroup } from "@/features/game/contracts";

export type SolvedGroupProps = {
  group: PuzzleGroup;
  entering?: boolean;
};

export function SolvedGroup({ group, entering = false }: SolvedGroupProps) {
  return (
    <article
      className="q-solved-group"
      data-difficulty={group.difficulty}
      data-entering={entering ? "true" : undefined}
      aria-label={`Çözülen grup: ${group.title}`}
    >
      <strong className="q-solved-title">{group.title}</strong>
      <span className="q-solved-words">
        {group.words.map((word) => word.text).join(" · ")}
      </span>
    </article>
  );
}
