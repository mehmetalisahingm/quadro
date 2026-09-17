import { GAME_CONSTANTS, type PuzzleGroup, type WordId } from "@/features/game/contracts";
import type { TutorialPuzzle } from "@/features/game/fixtures";

export type TutorialVerdict =
  | { kind: "incomplete" }
  | { kind: "wrong" }
  | { kind: "correct"; group: PuzzleGroup };

export function tutorialWordOrder(puzzle: TutorialPuzzle): WordId[] {
  const [first, second] = puzzle.groups;
  const [firstA, firstB, firstC, firstD] = first.words;
  const [secondA, secondB, secondC, secondD] = second.words;

  return [
    firstA.id,
    secondA.id,
    firstB.id,
    secondB.id,
    firstC.id,
    secondC.id,
    firstD.id,
    secondD.id,
  ];
}

export function evaluateTutorialSelection(
  puzzle: TutorialPuzzle,
  selectedWordIds: readonly WordId[],
  solvedGroupIds: readonly string[],
): TutorialVerdict {
  const uniqueSelection = new Set(selectedWordIds);
  if (
    selectedWordIds.length !== GAME_CONSTANTS.groupSize ||
    uniqueSelection.size !== GAME_CONSTANTS.groupSize
  ) {
    return { kind: "incomplete" };
  }

  const group = puzzle.groups.find(
    (candidate) =>
      !solvedGroupIds.includes(candidate.id) &&
      candidate.words.every((word) => uniqueSelection.has(word.id)),
  );

  return group ? { kind: "correct", group } : { kind: "wrong" };
}
