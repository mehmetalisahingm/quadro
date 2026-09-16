import { GAME_CONSTANTS, type GameSnapshot, type Puzzle } from "@/features/game/contracts";

import { ShareCard } from "./ShareCard";

export type GameResultProps = {
  puzzle: Puzzle;
  snapshot: GameSnapshot;
};

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function GameResult({ puzzle, snapshot }: GameResultProps) {
  const mistakesUsed = GAME_CONSTANTS.maxMistakes - snapshot.mistakesRemaining;
  const won = snapshot.status === "won";

  return (
    <section className="q-result" aria-labelledby="game-result-title">
      <div className="q-result-heading">
        <span className="q-result-eyebrow">{won ? "TAMAMLANDI" : "OYUN BİTTİ"}</span>
        <h2 id="game-result-title" className="q-result-title">
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
          <dd>{snapshot.solvedGroupIds.length}/4</dd>
        </div>
        <div>
          <dt>Hata</dt>
          <dd>{mistakesUsed}</dd>
        </div>
        <div>
          <dt>Süre</dt>
          <dd>{formatDuration(snapshot.activeSeconds)}</dd>
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
