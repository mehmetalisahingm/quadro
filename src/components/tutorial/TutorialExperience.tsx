"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { WordId } from "@/features/game/contracts";
import { tutorialPuzzle } from "@/features/game/fixtures";

import styles from "./TutorialExperience.module.css";
import {
  evaluateTutorialSelection,
  tutorialWordOrder,
  type TutorialVerdict,
} from "./tutorialLogic";

function messageFor(verdict: TutorialVerdict | null, completed: boolean): string {
  if (completed) return "Hazırsın. Günlük bulmacada dört farklı grubu aynı yöntemle bulacaksın.";
  if (!verdict) return "Birbiriyle bağlantılı dört kelime seç.";

  switch (verdict.kind) {
    case "incomplete":
      return "Kontrol etmek için dört kelime seç.";
    case "wrong":
      return "Bu dörtlü aynı gruba ait değil. Bir kartı değiştirip tekrar dene; burada hak kaybetmezsin.";
    case "correct":
      return `Doğru! ${verdict.group.title} grubunu buldun.`;
  }
}

export function TutorialExperience() {
  const initialOrder = useMemo(() => tutorialWordOrder(tutorialPuzzle), []);
  const [selectedWordIds, setSelectedWordIds] = useState<WordId[]>([]);
  const [solvedGroupIds, setSolvedGroupIds] = useState<string[]>([]);
  const [lastVerdict, setLastVerdict] = useState<TutorialVerdict | null>(null);

  const wordById = useMemo(
    () =>
      new Map(
        tutorialPuzzle.groups.flatMap((group) =>
          group.words.map((word) => [word.id, word] as const),
        ),
      ),
    [],
  );

  const solvedWordIds = useMemo(
    () =>
      new Set(
        tutorialPuzzle.groups
          .filter((group) => solvedGroupIds.includes(group.id))
          .flatMap((group) => group.words.map((word) => word.id)),
      ),
    [solvedGroupIds],
  );

  const remainingWordIds = initialOrder.filter((wordId) => !solvedWordIds.has(wordId));
  const completed = solvedGroupIds.length === tutorialPuzzle.groups.length;

  const toggleWord = (wordId: WordId) => {
    if (completed || solvedWordIds.has(wordId)) return;

    setLastVerdict(null);
    setSelectedWordIds((current) => {
      if (current.includes(wordId)) return current.filter((id) => id !== wordId);
      if (current.length >= 4) return current;
      return [...current, wordId];
    });
  };

  const clearSelection = () => {
    setSelectedWordIds([]);
    setLastVerdict(null);
  };

  const submit = () => {
    if (completed) return;

    const verdict = evaluateTutorialSelection(
      tutorialPuzzle,
      selectedWordIds,
      solvedGroupIds,
    );
    setLastVerdict(verdict);

    if (verdict.kind !== "correct") return;

    setSolvedGroupIds((current) => [...current, verdict.group.id]);
    setSelectedWordIds([]);
  };

  return (
    <section className={styles.shell} aria-labelledby="tutorial-title">
      <div className={styles.topline}>
        <span className={styles.badge}>KISA ÖĞRETİCİ</span>
        <Link className={styles.exitLink} href="/">
          Öğreticiden çık
        </Link>
      </div>

      <div className={styles.intro}>
        <h1 id="tutorial-title">Bağlantıyı bulmayı dene</h1>
        <p>
          Bu örnekte yalnız iki grup var. Dört bağlantılı kelimeyi seç ve kontrol et.
        </p>
        <p className={styles.safeNote}>
          Bu örnek günlük bulmacadan tamamen bağımsızdır; hak, süre, seri ve istatistiklerini etkilemez.
        </p>
      </div>

      {solvedGroupIds.length > 0 ? (
        <div className={styles.solvedList} aria-label="Öğreticide bulduğun gruplar">
          {solvedGroupIds.map((groupId) => {
            const group = tutorialPuzzle.groups.find((candidate) => candidate.id === groupId);
            if (!group) return null;

            return (
              <div key={group.id} className={styles.solvedGroup} data-difficulty={group.difficulty}>
                <strong>{group.title}</strong>
                <span>{group.words.map((word) => word.text).join(" · ")}</span>
              </div>
            );
          })}
        </div>
      ) : null}

      {!completed ? (
        <>
          <div className={styles.board} aria-label="Sekiz kelimelik öğretici tahtası">
            {remainingWordIds.map((wordId) => {
              const word = wordById.get(wordId);
              if (!word) return null;
              const selected = selectedWordIds.includes(wordId);

              return (
                <button
                  key={wordId}
                  type="button"
                  className={styles.tile}
                  aria-pressed={selected}
                  onClick={() => toggleWord(wordId)}
                >
                  {word.text}
                </button>
              );
            })}
          </div>

          <p className={styles.selection} aria-live="polite">
            {selectedWordIds.length}/4 seçili
          </p>

          <div
            className={styles.feedback}
            data-kind={lastVerdict?.kind ?? "idle"}
            role="status"
            aria-live="polite"
          >
            {messageFor(lastVerdict, false)}
          </div>

          <div className={styles.controls}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={clearSelection}
              disabled={selectedWordIds.length === 0}
            >
              Seçimi temizle
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={submit}
              disabled={selectedWordIds.length !== 4}
            >
              Kontrol et
            </button>
          </div>
        </>
      ) : (
        <div className={styles.complete} role="status">
          <span className={styles.completeMark} aria-hidden="true">✓</span>
          <h2>Öğretici tamamlandı</h2>
          <p>{messageFor(null, true)}</p>
          <Link className={styles.playLink} href="/play">
            Günlük bulmacaya geç
          </Link>
        </div>
      )}

      {!completed ? (
        <Link className={styles.skipLink} href="/play">
          Öğreticiyi geç ve günlük oyuna başla
        </Link>
      ) : null}
    </section>
  );
}
