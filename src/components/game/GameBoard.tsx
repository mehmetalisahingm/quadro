"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  GAME_CONSTANTS,
  type GameSnapshot,
  type Puzzle,
  type SubmitOutcome,
} from "@/features/game/contracts";
import { useGame } from "@/features/game/react/useGame";

import { GameResult } from "./GameResult";
import { MistakeMeter } from "./MistakeMeter";
import { SolvedGroup } from "./SolvedGroup";
import { WordTile } from "./WordTile";

export type GameBoardProps = {
  /** Oynanacak bulmaca. */
  puzzle: Puzzle;
  /** Kayıttan geri yüklenen durum; verilmezse boş oyun başlar. Yalnız oyun açılırken okunur. */
  initialSnapshot?: GameSnapshot;
};

function feedbackMessage(outcome: SubmitOutcome | null): string {
  if (!outcome) return "";

  switch (outcome.verdict) {
    case "correct":
      return `${outcome.solvedGroup.title} grubunu buldun.`;
    case "one-away":
      return "Bir kelime uzaktasın.";
    case "wrong":
      return "Bu dört kelime aynı grupta değil.";
    case "repeated":
      return "Bu dörtlüyü daha önce denedin.";
    case "invalid":
      if (outcome.reason === "selection-count") return "Gruplamak için dört kelime seç.";
      if (outcome.reason === "game-ended") return "Bu oyun sona erdi.";
      return "Bu seçim artık geçerli değil.";
  }
}

export function GameBoard(props: GameBoardProps) {
  const { puzzle, controller } = useGame(props.puzzle, {
    initialSnapshot: props.initialSnapshot,
  });
  const { snapshot } = controller;
  // Sonuç geçicidir ve kaydedilmez; açılışta geri bildirim yoktur.
  const [feedback, setFeedback] = useState<SubmitOutcome | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    },
    [],
  );

  const wordById = useMemo(
    () =>
      new Map(
        puzzle.groups.flatMap((group) =>
          group.words.map((word) => [word.id, word] as const),
        ),
      ),
    [puzzle],
  );

  const groupById = useMemo(
    () => new Map(puzzle.groups.map((group) => [group.id, group] as const)),
    [puzzle],
  );

  const isPlaying = snapshot.status === "playing";
  const canSubmit =
    isPlaying &&
    !isTransitioning &&
    snapshot.selectedWordIds.length === GAME_CONSTANTS.groupSize;

  const statusLabel =
    snapshot.status === "won"
      ? "Bulmaca tamamlandı"
      : snapshot.status === "lost"
        ? "Oyun sona erdi"
        : "Dört kelime seç";

  const submitSelection = () => {
    if (!canSubmit) return;

    setIsTransitioning(true);
    const result = controller.submitSelection();
    setFeedback(result.outcome);

    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    transitionTimer.current = setTimeout(() => {
      setIsTransitioning(false);
      transitionTimer.current = null;
    }, 260);
  };

  return (
    <section className="q-game-shell" aria-labelledby="game-board-title">
      <div className="q-game-intro">
        <h1 id="game-board-title" className="q-game-title">
          Gizli bağları bul
        </h1>
        <p className="q-game-description">
          Birbiriyle bağlantılı dört kelimeyi seç. Dört doğru grup bulduğunda oyun tamamlanır.
        </p>
      </div>

      <div className="q-game-status-row">
        <span>{statusLabel}</span>
        <span className="q-game-selection-count" aria-live="polite">
          {snapshot.selectedWordIds.length}/{GAME_CONSTANTS.groupSize} seçili
        </span>
      </div>

      <MistakeMeter
        remaining={snapshot.mistakesRemaining}
        total={GAME_CONSTANTS.maxMistakes}
      />

      {snapshot.solvedGroupIds.length > 0 ? (
        <div className="q-solved-list" aria-label="Bulduğun gruplar">
          {snapshot.solvedGroupIds.map((groupId) => {
            const group = groupById.get(groupId);
            return group ? <SolvedGroup key={groupId} group={group} /> : null;
          })}
        </div>
      ) : null}

      <div className="q-game-board" aria-label="16 kelimelik oyun tahtası">
        {snapshot.remainingWordOrder.length > 0 ? (
          snapshot.remainingWordOrder.map((wordId) => {
            const word = wordById.get(wordId);
            if (!word) return null;

            return (
              <WordTile
                key={wordId}
                id={wordId}
                text={word.text}
                selected={snapshot.selectedWordIds.includes(wordId)}
                disabled={!isPlaying || isTransitioning}
                onToggle={controller.toggleWord}
              />
            );
          })
        ) : (
          <p className="q-game-empty">Tahtadaki dört grup tamamlandı.</p>
        )}
      </div>

      <div
        className="q-game-feedback"
        data-verdict={feedback?.verdict ?? "idle"}
        role="status"
        aria-live="polite"
      >
        {feedbackMessage(feedback)}
      </div>

      {isPlaying ? (
        <div className="q-game-controls" aria-label="Oyun kontrolleri">
          <button
            type="button"
            className="q-game-control"
            onClick={controller.shuffle}
            disabled={isTransitioning || snapshot.remainingWordOrder.length < 2}
          >
            Karıştır
          </button>
          <button
            type="button"
            className="q-game-control"
            onClick={controller.clearSelection}
            disabled={isTransitioning || snapshot.selectedWordIds.length === 0}
          >
            Temizle
          </button>
          <button
            type="button"
            className="q-game-control q-game-submit"
            onClick={submitSelection}
            disabled={!canSubmit}
          >
            {isTransitioning ? "Kontrol ediliyor…" : "Grupla"}
          </button>
        </div>
      ) : (
        <GameResult puzzle={puzzle} snapshot={snapshot} />
      )}

      <p className="q-game-note">
        Doğruluk, hak ve oyun durumu arayüzde hesaplanmaz; oyun motorundan okunur.
      </p>
    </section>
  );
}
