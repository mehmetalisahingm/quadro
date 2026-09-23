import {
  GAME_CONSTANTS,
  type GameSnapshot,
  type SubmitOutcome,
} from "@/features/game/contracts";

/** Oyuncuya gösterilen gönderim geri bildiriminin tek metin kaynağı. */
export function feedbackMessage(outcome: SubmitOutcome | null): string {
  if (!outcome) return "";

  switch (outcome.verdict) {
    case "correct":
      return `Doğru — ${outcome.solvedGroup.title} grubunu buldun.`;
    case "one-away":
      return "Çok yakın — bir kelime uzaktasın.";
    case "wrong":
      return "Yanlış — bu dört kelime aynı grupta değil.";
    case "repeated":
      return "Tekrar — bu dörtlüyü daha önce denedin.";
    case "invalid":
      if (outcome.reason === "selection-count") return "Gruplamak için dört kelime seç.";
      if (outcome.reason === "game-ended") return "Bu oyun sona erdi.";
      return "Bu seçim artık geçerli değil.";
  }
}

/** Sonuç ekranında gösterilecek süreyi güvenli `m:ss` biçimine getirir. */
export function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export type ResultStats = {
  found: number;
  total: number;
  mistakesUsed: number;
  duration: string;
};

/** Sonuç ekranının sayısal sunum verilerini ortak oyun sabitlerinden üretir. */
export function getResultStats(snapshot: GameSnapshot): ResultStats {
  const mistakesUsed = Math.min(
    GAME_CONSTANTS.maxMistakes,
    Math.max(0, GAME_CONSTANTS.maxMistakes - snapshot.mistakesRemaining),
  );

  return {
    found: snapshot.solvedGroupIds.length,
    total: GAME_CONSTANTS.groupCount,
    mistakesUsed,
    duration: formatDuration(snapshot.activeSeconds),
  };
}
