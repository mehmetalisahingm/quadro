import type { GameSnapshot, Puzzle } from "@/features/game/contracts";

import { getResultStats } from "./presentation";
import { ShareCard } from "./ShareCard";

export type GameResultProps = {
  puzzle: Puzzle;
  snapshot: GameSnapshot;
};

export function GameResult({ puzzle, snapshot }: GameResultProps) {
  if (snapshot.status === "playing") return null;

  const won = snapshot.status === "won";
  const stats = getResultStats(snapshot);

  return (
    <section className="q-result" aria-labelledby="game-result-title">
      <div className="q-result-heading">
        <span className="q-result-eyebrow">{won ? "TAMAMLANDI" : "OYUN BİTTİ"}</span>
        <h2 id="game-result-title" className="q-result-title" tabIndex={-1}>
          {won ? "Dört bağı da buldun." : "Bugünlük bu kadar."}
        </h2>
        <p className="q-result-copy">
          {won
            ? "Bulduğun grupları ve açıklamalarını aşağıda görebilirsin."
            : "Bulduğun gruplar korunur; kalan cevaplar şimdi açıklanır."}
        </p>
      </div>

      <dl className="q-result-stats">
        <div>
          <dt>Bulunan</dt>
          <dd>{stats.found}/{stats.total}</dd>
        </div>
        <div>
          <dt>Hata</dt>
          <dd>{stats.mistakesUsed}</dd>
        </div>
        <div>
          <dt>Süre</dt>
          <dd>{stats.duration}</dd>
        </div>
      </dl>

      <div className="q-result-groups" aria-label="Bulmaca cevapları ve açıklamaları">
        {puzzle.groups.map((group) => {
          const found = snapshot.solvedGroupIds.includes(group.id);
          return (
            <article
              key={group.id}
              className="q-result-group"
              data-difficulty={group.difficulty}
            >
              <div className="q-result-group-topline">
                <strong>{group.title}</strong>
                <span>{found ? "Bulundu" : "Cevap"}</span>
              </div>
              <p className="q-result-group-words">
                {group.words.map((word) => word.text).join(" · ")}
              </p>
              <p className="q-result-group-explanation">{group.explanation}</p>
            </article>
          );
        })}
      </div>

      <ShareCard puzzle={puzzle} snapshot={snapshot} />
    </section>
  );
}
