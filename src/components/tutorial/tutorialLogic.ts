import type { PuzzleGroup, WordId } from "@/features/game/contracts";
import type { TutorialPuzzle } from "@/features/game/fixtures";

export type TutorialVerdict =
  | { kind: "incomplete" }
  | { kind: "wrong" }
  | { kind: "correct"; group: PuzzleGroup };

export function tutorialWordOrder(puzzle: TutorialPuzzle): WordId[] {
  const [first, second] = puzzle.groups;
  return first.words.flatMap((word, index) => [word.id, second.words[index].id]);
}

export function evaluateTutorialSelection(
  puzzle: TutorialPuzzle,
  selectedWordIds: readonly WordId[],
  solvedGroupIds: readonly string[],
): TutorialVerdict {
  if (selectedWordIds.length !== 4) return { kind: "incomplete" };

  const selected = new Set(selectedWordIds);
  const group = puzzle.groups.find(
    (candidate) =>
      !solvedGroupIds.includes(candidate.id) &&
      candidate.words.every((word) => selected.has(word.id)),
  );

  return group ? { kind: "correct", group } : { kind: "wrong" };
}
