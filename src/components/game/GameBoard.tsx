"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import {
  gameTransitionDuration,
  tileAnimationVerdict,
  type TileAnimationVerdict,
} from "@/animations/gameTransitions";
import { SoundPreference } from "@/components/settings/SoundPreference";
import { useGameSounds } from "@/components/settings/useGameSounds";
import {
  GAME_CONSTANTS,
  type Puzzle,
  type SubmitOutcome,
  type WordId,
} from "@/features/game/contracts";
import { standardPuzzle } from "@/features/game/fixtures";
import {
  createHintStore,
  difficultyFeedback,
  getDifficultyMode,
  type GameDifficulty,
} from "@/features/game/difficulty";
import { usePersistentGame } from "@/features/game/state";
import { currentUserIsAdmin } from "@/lib/auth/admin";
import { AUTH_SESSION_EVENT, readStoredSession } from "@/lib/auth/client";

import motionStyles from "./GameAnimations.module.css";
import difficultyStyles from "./GameDifficulty.module.css";
import { GameResult } from "./GameResult";
import { GameLoading } from "./GameLoading";
import { MistakeMeter } from "./MistakeMeter";
import { feedbackMessage } from "./presentation";
import { CardShuffleIntro } from "./CardShuffleIntro";
import { RecoveryNotice } from "./RecoveryNotice";
import { SolvedGroup } from "./SolvedGroup";
import { WordTile } from "./WordTile";

export type GameBoardProps = {
  puzzle?: Puzzle;
  difficulty?: GameDifficulty;
  onOpenRules?: () => void;
  playIntro?: boolean;
};

type AnimatedAttempt = {
  wordIds: WordId[];
  verdict: TileAnimationVerdict;
};

const CINEMATIC_WORD_ORDER = [0, 5, 10, 15, 3, 6, 9, 12, 1, 4, 11, 14, 2, 7, 8, 13] as const;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function GameBoard({ puzzle: dailyPuzzle, difficulty = "medium", onOpenRules, playIntro = true }: GameBoardProps = {}) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    const syncAdmin = () => {
      if (!readStoredSession()) {
        if (active) setIsAdmin(false);
        return;
      }
      void currentUserIsAdmin().then((admin) => {
        if (active) setIsAdmin(admin);
      });
    };

    syncAdmin();
    window.addEventListener(AUTH_SESSION_EVENT, syncAdmin);
    window.addEventListener("storage", syncAdmin);
    return () => {
      active = false;
      window.removeEventListener(AUTH_SESSION_EVENT, syncAdmin);
      window.removeEventListener("storage", syncAdmin);
    };
  }, []);

  const { puzzle, controller, restore } = usePersistentGame(dailyPuzzle ?? standardPuzzle, {
    unlimitedMistakes: isAdmin,
  });
  const { snapshot } = controller;
  const mode = getDifficultyMode(difficulty);
  const hintStore = useMemo(() => createHintStore(puzzle, difficulty), [puzzle, difficulty]);
  const hints = useSyncExternalStore(hintStore.subscribe, hintStore.getState, hintStore.getServerState);
  const hintsRemaining = mode.hintLimit - hints.revealedGroupIds.length;
  const hasUnrevealedGroup = puzzle.groups.some((group) =>
    !snapshot.solvedGroupIds.includes(group.id) && !hints.revealedGroupIds.includes(group.id),
  );
  const sounds = useGameSounds();
  const [feedback, setFeedback] = useState<SubmitOutcome | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [animatedAttempt, setAnimatedAttempt] = useState<AnimatedAttempt | null>(null);
  const [enteringGroupId, setEnteringGroupId] = useState<string | null>(null);
  const [terminalRevealPending, setTerminalRevealPending] = useState(false);
  const [cinematicRevealedPuzzleId, setCinematicRevealedPuzzleId] = useState<string | null>(null);
  const [cinematicCompletedPuzzleId, setCinematicCompletedPuzzleId] = useState<string | null>(null);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const terminalSoundPending = useRef(false);

  useEffect(() => { hintStore.hydrate(); }, [hintStore]);

  useEffect(
    () => () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    },
    [],
  );

  const cinematicDone = !playIntro || cinematicCompletedPuzzleId === puzzle.id;
  const cinematicBoardReady = cinematicDone || cinematicRevealedPuzzleId === puzzle.id;
  const revealCinematic = useCallback(() => {
    setCinematicRevealedPuzzleId(puzzle.id);
  }, [puzzle.id]);
  const finishCinematic = useCallback(() => {
    setCinematicRevealedPuzzleId(puzzle.id);
    setCinematicCompletedPuzzleId(puzzle.id);
    requestAnimationFrame(() => document.getElementById("game-board-title")?.focus({ preventScroll: true }));
  }, [puzzle.id]);

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
    () => new Map(puzzle.groups.flatMap((group) => group.words.map((word) => [word.id, word] as const))),
    [puzzle],
  );
  const groupById = useMemo(
    () => new Map(puzzle.groups.map((group) => [group.id, group] as const)),
    [puzzle],
  );
  const cinematicWords = useMemo(() => {
    if (snapshot.remainingWordOrder.length === 16) {
      return snapshot.remainingWordOrder
        .map((wordId) => wordById.get(wordId)?.text)
        .filter((word): word is string => word !== undefined);
    }

    const allWords = puzzle.groups.flatMap((group) => group.words);
    return CINEMATIC_WORD_ORDER
      .map((index) => allWords[index]?.text)
      .filter((word): word is string => word !== undefined);
  }, [puzzle, snapshot.remainingWordOrder, wordById]);

  const canSubmit =
    isPlaying && cinematicDone && !isTransitioning && snapshot.selectedWordIds.length === GAME_CONSTANTS.groupSize;

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
    if (!isPlaying || isTransitioning || !cinematicDone) return;
    const selectionWillChange =
      snapshot.selectedWordIds.includes(wordId) ||
      snapshot.selectedWordIds.length < GAME_CONSTANTS.groupSize;
    clearTransientFeedback();
    controller.toggleWord(wordId);
    if (selectionWillChange) sounds.play("select");
  };

  const clearSelection = () => {
    if (!isPlaying || isTransitioning || !cinematicDone) return;
    clearTransientFeedback();
    controller.clearSelection();
  };

  const shuffle = () => {
    if (!isPlaying || isTransitioning || !cinematicDone) return;
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
    const visibleOutcome = difficultyFeedback(result.outcome, difficulty);
    const tileVerdict = tileAnimationVerdict(visibleOutcome);
    const terminal = result.snapshot.status !== "playing";

    if (visibleOutcome.verdict === "wrong") sounds.play("wrong");
    if (visibleOutcome.verdict === "one-away") sounds.play("one-away");
    if (visibleOutcome.verdict === "correct") sounds.play("correct");
    terminalSoundPending.current = terminal;

    setFeedback(visibleOutcome);
    setAnimatedAttempt(tileVerdict ? { wordIds: submittedWordIds, verdict: tileVerdict } : null);
    setEnteringGroupId(result.outcome.verdict === "correct" ? result.outcome.solvedGroup.id : null);
    setTerminalRevealPending(terminal);

    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    const duration = gameTransitionDuration(visibleOutcome, result.snapshot.status, prefersReducedMotion());
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
      data-difficulty={difficulty}
    >
      {!cinematicDone && isPlaying ? (
        <CardShuffleIntro
          puzzleId={puzzle.id}
          words={cinematicWords}
          soundEnabled={sounds.enabled}
          playSound={sounds.play}
          onReveal={revealCinematic}
          onDone={finishCinematic}
        />
      ) : null}

      <RecoveryNotice restore={restore} />
      <div className={difficultyStyles.toolbar}>
        <span className={difficultyStyles.badge} data-difficulty={difficulty}>{mode.label} mod</span>
        {onOpenRules ? (
          <button type="button" className={difficultyStyles.rules} onClick={onOpenRules} disabled={!cinematicDone && isPlaying}>
            Kural kitapçığı ↗
          </button>
        ) : null}
      </div>
      <div className="q-game-intro">
        <h1 id="game-board-title" className="q-game-title" tabIndex={-1}>Gizli bağları bul</h1>
        <p id="game-board-instructions" className="q-game-description">
          Birbiriyle bağlantılı dört kelimeyi seç. Dört doğru grup bulduğunda oyun tamamlanır.
        </p>
        {isAdmin ? <p className="q-game-description"><strong>Admin modu · sınırsız hata hakkı</strong></p> : null}
        {isPlaying ? <SoundPreference enabled={sounds.enabled} onChange={sounds.setEnabledByUser} /> : null}
      </div>

      {showGameSurface ? (
        <>
          <div className="q-game-status-row">
            <span>
              {isPlaying ? "Dört kelime seç" : snapshot.status === "won" ? "Son grup bulundu" : "Son tahmin işlendi"}
            </span>
            <span className="q-game-selection-count" aria-live="polite" aria-atomic="true">
              {isPlaying ? `${snapshot.selectedWordIds.length}/${GAME_CONSTANTS.groupSize} seçili` : "Sonuç hazırlanıyor"}
            </span>
          </div>

          <MistakeMeter
            remaining={snapshot.mistakesRemaining}
            total={GAME_CONSTANTS.maxMistakes}
            unlimited={isAdmin}
          />

          {snapshot.solvedGroupIds.length > 0 ? (
            <div className="q-solved-list" aria-label="Bulduğun gruplar">
              {snapshot.solvedGroupIds.map((groupId) => {
                const group = groupById.get(groupId);
                return group ? <SolvedGroup key={groupId} group={group} entering={groupId === enteringGroupId} /> : null;
              })}
            </div>
          ) : null}

          {snapshot.remainingWordOrder.length > 0 ? (
            <div
              className={`q-game-board${playIntro && cinematicBoardReady ? ` ${motionStyles.boardCinematicReveal}` : ""}`}
              aria-label={`${snapshot.remainingWordOrder.length} çözülmemiş kelimelik oyun tahtası`}
              aria-describedby="game-board-instructions"
              data-cinematic-ready={cinematicBoardReady ? "true" : undefined}
            >
              {snapshot.remainingWordOrder.map((wordId) => {
                const word = wordById.get(wordId);
                if (!word) return null;
                const animation = animatedAttempt?.wordIds.includes(wordId) ? animatedAttempt.verdict : null;
                return (
                  <WordTile
                    key={wordId}
                    id={wordId}
                    text={word.text}
                    selected={snapshot.selectedWordIds.includes(wordId)}
                    disabled={isTransitioning || !isPlaying || !cinematicDone}
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
              <button type="button" className="q-game-control" onClick={shuffle} disabled={isTransitioning || !cinematicDone || snapshot.remainingWordOrder.length < 2}>
                Karıştır
              </button>
              <button type="button" className="q-game-control" onClick={clearSelection} disabled={isTransitioning || !cinematicDone || snapshot.selectedWordIds.length === 0}>
                Temizle
              </button>
              <button type="button" className="q-game-control q-game-submit" onClick={submitCurrentSelection} disabled={!canSubmit}>
                {isTransitioning ? "Kontrol ediliyor…" : "Grupla"}
              </button>
            </div>
          ) : null}
          {isPlaying && mode.hintLimit > 0 ? (
            <aside className={difficultyStyles.hints} aria-label="Kategori ipuçları">
              <div className={difficultyStyles.hintActions}>
                <button
                  type="button"
                  className={difficultyStyles.hintButton}
                  disabled={!hints.hydrated || !cinematicDone || isTransitioning || hintsRemaining === 0 || !hasUnrevealedGroup}
                  onClick={() => hintStore.revealNext(snapshot.solvedGroupIds)}
                >
                  <span aria-hidden="true">✦</span> Kategori ipucu
                </button>
                <span className={difficultyStyles.budget} aria-live="polite">
                  {hintsRemaining}/{mode.hintLimit} ipucu kaldı
                </span>
              </div>
              <ul className={difficultyStyles.hintList} aria-live="polite" aria-relevant="additions">
                {hints.revealedGroupIds.map((id) => (
                  <li key={id} className={difficultyStyles.hint} data-solved={snapshot.solvedGroupIds.includes(id)}>
                    {groupById.get(id)?.title}
                  </li>
                ))}
              </ul>
            </aside>
          ) : isPlaying ? (
            <p className={difficultyStyles.hardNote}>İpucu yok. Çok yaklaştın bildirimi kapalı.</p>
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
