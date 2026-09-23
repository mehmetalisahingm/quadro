"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  gameTransitionDuration,
  tileAnimationVerdict,
  type TileAnimationVerdict,
} from "@/animations/gameTransitions";
import {
  GAME_CONSTANTS,
  type Puzzle,
  type SubmitOutcome,
  type WordId,
} from "@/features/game/contracts";
import { standardPuzzle } from "@/features/game/fixtures";
import { usePersistentGame } from "@/features/game/state";
import { SoundPreference } from "@/components/settings/SoundPreference";
import { useGameSounds } from "@/components/settings/useGameSounds";

import motionStyles from "./GameAnimations.module.css";
import { GameResult } from "./GameResult";
import { GameLoading } from "./GameLoading";
import { RecoveryNotice } from "./RecoveryNotice";
import { MistakeMeter } from "./MistakeMeter";
import { feedbackMessage } from "./presentation";
import { SolvedGroup } from "./SolvedGroup";
import { WordTile } from "./WordTile";

export type GameBoardProps = {
  /**
   * Oynanacak bulmaca. `/play` bunu Q19 günlük yayın katmanından, sunucuda okunmuş
   * haliyle geçirir. Verilmezse Q03'ün örnek bulmacası açılır; böylece tahtayı tek
   * başına çizen mevcut çağrılar (Storybook benzeri denemeler, eski testler)
   * çalışmaya devam eder.
   */
  puzzle?: Puzzle;
};

type AnimatedAttempt = {
  wordIds: WordId[];
  verdict: TileAnimationVerdict;
};

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function GameBoard({ puzzle: dailyPuzzle }: GameBoardProps = {}) {
  const { puzzle, controller, restore } = usePersistentGame(dailyPuzzle ?? standardPuzzle);
  const { snapshot } = controller;
  const sounds = useGameSounds();
  const [feedback, setFeedback] = useState<SubmitOutcome | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [animatedAttempt, setAnimatedAttempt] = useState<AnimatedAttempt | null>(null);
  const [enteringGroupId, setEnteringGroupId] = useState<string | null>(null);
  const [terminalRevealPending, setTerminalRevealPending] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const terminalSoundPending = useRef(false);

  useEffect(
    () => () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    },
    [],
  );

  const isPlaying = snapshot.status === "playing";
  const showResult = !isPlaying && !terminalRevealPending;
  const showGameSurface = !showResult;

  useEffect(() => {
    if (!showResult) return;

    const frame = requestAnimationFrame(() => {
      document.getElementById("game-result-title")?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [showResult]);

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

  const canSubmit =
    isPlaying &&
    !isTransitioning &&
    snapshot.selectedWordIds.length === GAME_CONSTANTS.groupSize;

  const feedbackAnimationClass =
    feedback?.verdict === "correct"
      ? motionStyles.feedbackCorrect
      : feedback?.verdict === "one-away"
        ? motionStyles.feedbackOneAway
        : "";

  const clearTransientFeedback = () => {
    if (feedback) setFeedback(null);
  };

  const toggleWord = (wordId: WordId) => {
    if (!isPlaying || isTransitioning) return;

    const selectionWillChange =
      snapshot.selectedWordIds.includes(wordId) ||
      snapshot.selectedWordIds.length < GAME_CONSTANTS.groupSize;

    clearTransientFeedback();
    controller.toggleWord(wordId);
    if (selectionWillChange) sounds.play("select");
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

  const finishVisualTransition = () => {
    if (terminalSoundPending.current) {
      terminalSoundPending.current = false;
      sounds.play("finish");
    }

    setIsTransitioning(false);
    setAnimatedAttempt(null);
    setEnteringGroupId(null);
    setTerminalRevealPending(false);
    transitionTimer.current = null;
  };

  const submitCurrentSelection = () => {
    if (!canSubmit) return;

    const submittedWordIds = [...snapshot.selectedWordIds];
    setIsTransitioning(true);

    const result = controller.submitSelection();
    const tileVerdict = tileAnimationVerdict(result.outcome);
    const terminal = result.snapshot.status !== "playing";

    if (result.outcome.verdict === "wrong") sounds.play("wrong");
    if (result.outcome.verdict === "one-away") sounds.play("one-away");
    if (result.outcome.verdict === "correct") sounds.play("correct");
    terminalSoundPending.current = terminal;

    setFeedback(result.outcome);
    setAnimatedAttempt(
      tileVerdict ? { wordIds: submittedWordIds, verdict: tileVerdict } : null,
    );
    setEnteringGroupId(
      result.outcome.verdict === "correct" ? result.outcome.solvedGroup.id : null,
    );
    setTerminalRevealPending(terminal);

    if (transitionTimer.current) clearTimeout(transitionTimer.current);

    const duration = gameTransitionDuration(
      result.outcome,
      result.snapshot.status,
      prefersReducedMotion(),
    );

    if (duration === 0) {
      finishVisualTransition();
      return;
    }

    transitionTimer.current = setTimeout(finishVisualTransition, duration);
  };

  if (restore.status === "pending") return <GameLoading />;

  return (
    <section
      className="q-game-shell"
      aria-labelledby="game-board-title"
      data-transitioning={isTransitioning ? "true" : undefined}
    >
      <RecoveryNotice restore={restore} />
      <div className="q-game-intro">
        <h1 id="game-board-title" className="q-game-title">
          Gizli bağları bul
        </h1>
        <p id="game-board-instructions" className="q-game-description">
          Birbiriyle bağlantılı dört kelimeyi seç. Dört doğru grup bulduğunda oyun tamamlanır.
        </p>
        {isPlaying ? (
          <SoundPreference enabled={sounds.enabled} onChange={sounds.setEnabledByUser} />
        ) : null}
      </div>

      {showGameSurface ? (
        <>
          <div className="q-game-status-row">
            <span>
              {isPlaying
                ? "Dört kelime seç"
                : snapshot.status === "won"
                  ? "Son grup bulundu"
                  : "Son tahmin işlendi"}
            </span>
            <span className="q-game-selection-count" aria-live="polite" aria-atomic="true">
              {isPlaying
                ? `${snapshot.selectedWordIds.length}/${GAME_CONSTANTS.groupSize} seçili`
                : "Sonuç hazırlanıyor"}
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
                return group ? (
                  <SolvedGroup
                    key={groupId}
                    group={group}
                    entering={groupId === enteringGroupId}
                  />
                ) : null;
              })}
            </div>
          ) : null}

          {snapshot.remainingWordOrder.length > 0 ? (
            <div
              className="q-game-board"
              aria-label={`${snapshot.remainingWordOrder.length} çözülmemiş kelimelik oyun tahtası`}
              aria-describedby="game-board-instructions"
            >
              {snapshot.remainingWordOrder.map((wordId) => {
                const word = wordById.get(wordId);
                if (!word) return null;

                const animation = animatedAttempt?.wordIds.includes(wordId)
                  ? animatedAttempt.verdict
                  : null;

                return (
                  <WordTile
                    key={wordId}
                    id={wordId}
                    text={word.text}
                    selected={snapshot.selectedWordIds.includes(wordId)}
                    disabled={isTransitioning || !isPlaying}
                    animation={animation}
                    onToggle={toggleWord}
                  />
                );
              })}
            </div>
          ) : null}

          <div
            className={`q-game-feedback${feedbackAnimationClass ? ` ${feedbackAnimationClass}` : ""}`}
            data-verdict={feedback?.verdict ?? "idle"}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {feedbackMessage(feedback)}
          </div>

          {isPlaying ? (
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
          ) : null}
        </>
      ) : (
        <div className={motionStyles.resultEntering}>
          <GameResult puzzle={puzzle} snapshot={snapshot} />
        </div>
      )}
    </section>
  );
}
