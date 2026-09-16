export const APP_NAME = "Quadro" as const;

export const APP_TAGLINE =
  "Türkçe günlük gruplama bulmacası: 16 kelime, 4 gizli bağ, 4 hata hakkı." as const;

/** Oyun kural sabitleri. Kesin sözleşme Q02 (#2) ile netleşecek. */
export const GAME_RULES = {
  wordCount: 16,
  groupCount: 4,
  groupSize: 4,
  maxMistakes: 4,
} as const;
