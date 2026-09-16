"use client";

import { useMemo } from "react";

import { GAME_CONSTANTS } from "@/features/game/contracts";
import type { SampleScenarioId } from "@/features/game/fixtures";
import { useSampleGame } from "@/features/game/react/useSampleGame";

import { WordTile } from "./WordTile";

export type GameBoardProps = {
  scenarioId?: SampleScenarioId;
};

export function GameBoard({ scenarioId = "empty" }: GameBoardProps) {
  const { puzzle, controller } = useSampleGame(scenarioId);
  const { snapshot } = controller;

  const wordById = useMemo(
    () =>
      new Map(
        puzzle.groups.flatMap((group) =>
          group.words.map((word) => [word.id, word] as const),
        ),
      ),
    [puzzle],
  );

  const isPlaying = snapshot.status === "playing";
  const canSubmit =
    isPlaying && snapshot.selectedWordIds.length === GAME_CONSTANTS.groupSize;

  const statusLabel =
    snapshot.status === "won"
      ? "Bulmaca tamamlandı"
      : snapshot.status === "lost"
        ? "Oyun sona erdi"
        : "Dört kelime seç";

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
                disabled={!isPlaying}
                onToggle={controller.toggleWord}
              />
            );
          })
        ) : (
          <p className="q-game-empty">Tahtadaki dört grup tamamlandı.</p>
        )}
      </div>

      <div className="q-game-controls" aria-label="Oyun kontrolleri">
        <button
          type="button"
          className="q-game-control"
          onClick={controller.shuffle}
          disabled={!isPlaying || snapshot.remainingWordOrder.length < 2}
        >
          Karıştır
        </button>
        <button
          type="button"
          className="q-game-control"
          onClick={controller.clearSelection}
          disabled={!isPlaying || snapshot.selectedWordIds.length === 0}
        >
          Temizle
        </button>
        <button
          type="button"
          className="q-game-control q-game-submit"
          onClick={() => controller.submitSelection()}
          disabled={!canSubmit}
        >
          Grupla
        </button>
      </div>

      <p className="q-game-note">
        Doğruluk, hak ve oyun durumu arayüzde hesaplanmaz; Q03 denetleyicisinden okunur.
      </p>
    </section>
  );
}
