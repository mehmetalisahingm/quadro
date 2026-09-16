"use client";

import { useMemo, useState } from "react";

import type { GameSnapshot, Puzzle, WordId } from "@/features/game/contracts";

export type ShareCardProps = {
  puzzle: Puzzle;
  snapshot: GameSnapshot;
};

const emojiByDifficulty = {
  1: "🟨",
  2: "🟩",
  3: "🟦",
  4: "🟪",
} as const;

export function buildShareText(puzzle: Puzzle, snapshot: GameSnapshot): string {
  const symbolByWordId = new Map<WordId, string>();
  for (const group of puzzle.groups) {
    const symbol = emojiByDifficulty[group.difficulty];
    for (const word of group.words) symbolByWordId.set(word.id, symbol);
  }

  const rows = snapshot.attempts.map((attempt) =>
    attempt.wordIds.map((wordId) => symbolByWordId.get(wordId) ?? "⬜").join(""),
  );
  const score = `${snapshot.solvedGroupIds.length}/4`;

  return [`Quadro ${puzzle.date} ${score}`, ...rows].join("\n");
}

export function ShareCard({ puzzle, snapshot }: ShareCardProps) {
  const shareText = useMemo(() => buildShareText(puzzle, snapshot), [puzzle, snapshot]);
  const [status, setStatus] = useState("");
  const [showFallback, setShowFallback] = useState(false);

  const copy = async () => {
    try {
      if (!navigator.clipboard) throw new Error("clipboard-unavailable");
      await navigator.clipboard.writeText(shareText);
      setShowFallback(false);
      setStatus("Sonuç panoya kopyalandı.");
    } catch {
      setShowFallback(true);
      setStatus("Otomatik kopyalama kullanılamadı. Metni aşağıdan seçebilirsin.");
    }
  };

  const share = async () => {
    try {
      if (!navigator.share) {
        await copy();
        return;
      }
      await navigator.share({ title: "Quadro", text: shareText });
      setStatus("Paylaşım tamamlandı.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShowFallback(true);
      setStatus("Paylaşım açılamadı. Metni aşağıdan kopyalayabilirsin.");
    }
  };

  return (
    <section className="q-share-card" aria-labelledby="share-title">
      <div>
        <h3 id="share-title" className="q-share-title">Sonucunu paylaş</h3>
        <p className="q-share-description">Kelime ve kategori cevapları paylaşım metnine girmez.</p>
      </div>

      <pre className="q-share-preview" aria-label="Spoilersız paylaşım önizlemesi">
        {shareText}
      </pre>

      <div className="q-share-actions">
        <button type="button" className="q-game-control q-share-primary" onClick={share}>
          Paylaş
        </button>
        <button type="button" className="q-game-control" onClick={copy}>
          Kopyala
        </button>
      </div>

      <p className="q-share-status" role="status" aria-live="polite">{status}</p>

      {showFallback ? (
        <label className="q-share-fallback">
          <span>Paylaşım metni</span>
          <textarea readOnly value={shareText} rows={Math.max(snapshot.attempts.length + 1, 3)} />
        </label>
      ) : null}
    </section>
  );
}
