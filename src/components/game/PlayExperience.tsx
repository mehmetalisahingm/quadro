"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";

import { gameOpeningFor } from "@/animations/openingScenes";
import type { Puzzle } from "@/features/game/contracts";
import { resolveGameDifficulty, type GameDifficulty } from "@/features/game/difficulty";
import { parseStoredRecord } from "@/lib/persistence/record";
import { snapshotStorageKey } from "@/lib/persistence/snapshotStore";

import { GameBoard } from "./GameBoard";
import { GameLoading } from "./GameLoading";
import { GameWelcome } from "./GameWelcome";
import styles from "./PlayExperience.module.css";

export function playModeKey(puzzle: Puzzle): string {
  return `quadro:play-mode:v1:${puzzle.date}:${puzzle.id}:${puzzle.revision}`;
}

const subscribe = (listener: () => void) => {
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
};
const serverSession = () => "loading" as const;

/** Read-only: the game store alone validates and repairs the actual save. */
function readSession(puzzle: Puzzle): GameDifficulty | "new" {
  try {
    const savedMode = window.localStorage.getItem(playModeKey(puzzle));
    if (savedMode === "easy" || savedMode === "medium" || savedMode === "hard") return savedMode;
    const savedGame = window.localStorage.getItem(snapshotStorageKey(puzzle.date));
    if (savedGame) {
      const parsed = parseStoredRecord(savedGame);
      if (parsed.ok && parsed.record.snapshot.puzzleId === puzzle.id &&
        parsed.record.snapshot.puzzleRevision === puzzle.revision &&
        parsed.record.snapshot.dayKey === puzzle.date &&
        parsed.record.snapshot.status !== "playing") return "medium";
    }
  } catch { /* Private browsing can deny storage; playing still works. */ }
  return "new";
}

export function PlayExperience({ puzzle }: { puzzle: Puzzle }) {
  const getSession = useCallback(() => readSession(puzzle), [puzzle]);
  const savedSession = useSyncExternalStore(subscribe, getSession, serverSession);
  const [chosenMode, setChosenMode] = useState<GameDifficulty | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const rulesDialog = useRef<HTMLDialogElement>(null);

  const start = (difficulty: GameDifficulty) => {
    window.scrollTo(0, 0);
    setChosenMode(difficulty);
    try { window.localStorage.setItem(playModeKey(puzzle), difficulty); } catch { /* Optional storage. */ }
  };

  if (savedSession === "loading" && chosenMode === null) return <GameLoading />;
  if (savedSession === "new" && chosenMode === null) {
    const opening = gameOpeningFor(puzzle.id, puzzle.date);
    const hasLandscape = opening === "sunrise" || opening === "sunset" || opening === "snow";
    return <>
      {hasLandscape && <link rel="preload" as="image" href={`/images/openings/${opening}-premium.webp`} />}
      <GameWelcome onStart={start} />
    </>;
  }

  const difficulty = chosenMode ?? resolveGameDifficulty(savedSession);
  return (
    <div className={styles.experience}>
      <GameBoard puzzle={puzzle} difficulty={difficulty} playIntro={chosenMode !== null}
        onOpenRules={() => { setRulesOpen(true); rulesDialog.current?.showModal(); }} />
      <dialog ref={rulesDialog} className={styles.ruleDialog} aria-label="Quadro kural kitapçığı"
        onClose={() => setRulesOpen(false)}
        onClick={(event) => { if (event.target === event.currentTarget) rulesDialog.current?.close(); }}>
        {rulesOpen ? <GameWelcome initialDifficulty={difficulty} rulesOnly onStart={start}
          onClose={() => rulesDialog.current?.close()} /> : null}
      </dialog>
    </div>
  );
}
