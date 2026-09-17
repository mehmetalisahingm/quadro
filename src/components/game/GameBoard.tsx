"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  GAME_CONSTANTS,
  type SubmitOutcome,
  type WordId,
} from "@/features/game/contracts";
import { useGame } from "@/features/game/react/useGame";

import { GameResult } from "./GameResult";
import { MistakeMeter } from "./MistakeMeter";
import { feedbackMessage } from "./presentation";
import { SolvedGroup } from "./SolvedGroup";
import { WordTile } from "./WordTile";

export function GameBoard() {
  const { puzzle, controller } = useGame();
  const { snapshot } = controller;
  const [feedback, setFeedback] = useState<SubmitOutcome | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (snapshot.status === "playing") return;

    const frame = requestAnimationFrame(() => {
      document.getElementById("game-result-title")?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [snapshot.status]);

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

  const clearTransientFeedback = () => {
    if (feedback) setFeedback(null);
  };

  const toggleWord = (wordId: WordId) => {
    if (!isPlaying || isTransitioning) return;
    clearTransientFeedback();
    controller.toggleWord(wordId);
  };

  const clearSelection = () => {
    if (!isPlaying || isTransitioning) return;
    clearTransientFeedback();
    controller.clearSelection();
  };

  const shuffle = () => {
    if (!isPlaying || isTransitioning) return;
    clearTransientFeedback();
    controller.shuffle();
  };

  const submitCurrentSelection = () => {
    if (!canSubmit) return;

    setIsTransitioning(true);
    const result = controller.submitSelection();
    setFeedback(result.outcome);

    if (transitionTimer.current) clearTimeout(transitionTimer.current);

    if (result.snapshot.status !== "playing") {
      setIsTransitioning(false);
      transitionTimer.current = null;
      return;
    }

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
        <p id="game-board-instructions" className="q-game-description">
          Birbiriyle bağlantılı dört kelimeyi seç. Dört doğru grup bulduğunda oyun tamamlanır.
        </p>
      </div>

      {isPlaying ? (
        <>
          <div className="q-game-status-row">
            <span>Dört kelime seç</span>
            <span className="q-game-selection-count" aria-live="polite" aria-atomic="true">
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

          <div
            className="q-game-board"
            aria-label={`${snapshot.remainingWordOrder.length} çözülmemiş kelimelik oyun tahtası`}
            aria-describedby="game-board-instructions"
          >
            {snapshot.remainingWordOrder.map((wordId) => {
              const word = wordById.get(wordId);
              if (!word) return null;

              return (
                <WordTile
                  key={wordId}
                  id={wordId}
                  text={word.text}
                  selected={snapshot.selectedWordIds.includes(wordId)}
                  disabled={isTransitioning}
                  onToggle={toggleWord}
                />
              );
            })}
          </div>

          <div
            className="q-game-feedback"
            data-verdict={feedback?.verdict ?? "idle"}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {feedbackMessage(feedback)}
          </div>

          <div className="q-game-controls" aria-label="Oyun kontrolleri">
            <button
              type="button"
              className="q-game-control"
              onClick={shuffle}
              disabled={isTransitioning || snapshot.remainingWordOrder.length < 2}
            >
              Karıştır
            </button>
            <button
              type="button"
              className="q-game-control"
              onClick={clearSelection}
              disabled={isTransitioning || snapshot.selectedWordIds.length === 0}
            >
              Temizle
            </button>
            <button
              type="button"
              className="q-game-control q-game-submit"
              onClick={submitCurrentSelection}
              disabled={!canSubmit}
            >
              {isTransitioning ? "Kontrol ediliyor…" : "Grupla"}
            </button>
          </div>
        </>
      ) : (
        <GameResult puzzle={puzzle} snapshot={snapshot} />
      )}
    </section>
  );
}
