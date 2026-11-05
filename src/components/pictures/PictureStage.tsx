"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

import { GameBoard } from "@/components/game/GameBoard";
import type { Puzzle } from "@/features/game/contracts";
import { hintStorageKey } from "@/features/game/difficulty";
import { PICTURE_BOARD_COUNT, PICTURE_BOARDS, pictureHref } from "@/features/game/pictures";
import {
  emptyPictureSnapshot,
  pictureProgressSnapshot,
  resetPictureBoard,
  subscribePictures,
  type PictureBoardProgress,
} from "@/lib/persistence/pictureProgress";

import styles from "./Pictures.module.css";

export function PictureStage({ puzzle, board }: { puzzle: Puzzle; board: number }) {
  const raw = useSyncExternalStore(subscribePictures, pictureProgressSnapshot, emptyPictureSnapshot);
  const [attempt, setAttempt] = useState(0);
  const entry = PICTURE_BOARDS[board - 1];
  if (!entry) return null;

  const progress: PictureBoardProgress[] = raw ? JSON.parse(raw) : [];
  const status = progress[board - 1]?.status;
  const replay = () => {
    resetPictureBoard(board);
    try {
      window.localStorage.removeItem(hintStorageKey(puzzle, entry.difficulty));
    } catch {
      // İpucu kaydı isteğe bağlıdır.
    }
    setAttempt((value) => value + 1);
  };

  return (
    <>
      <header className={styles.stageHeader}>
        <Link href="/pictures">← Resimli Quadro</Link>
        <span>TAHTA {board} / {PICTURE_BOARD_COUNT} · {entry.label.toLocaleUpperCase("tr-TR")}</span>
      </header>
      <GameBoard key={`${puzzle.id}:${attempt}`} puzzle={puzzle} difficulty={entry.difficulty} playIntro={false} />
      {status === "won" || status === "lost" ? (
        <section className={styles.finish} aria-label="Tahta sonrası seçenekler">
          {status === "won" && board < PICTURE_BOARD_COUNT ? (
            <Link className={styles.primary} href={pictureHref(board + 1)}>Sonraki tahtaya geç →</Link>
          ) : null}
          <button type="button" className={styles.secondary} onClick={replay}>Bu tahtayı yeniden oyna ↻</button>
          <Link href="/pictures">Tüm tahtalar</Link>
        </section>
      ) : null}
    </>
  );
}
