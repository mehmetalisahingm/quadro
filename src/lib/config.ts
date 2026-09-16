import { GAME_CONSTANTS } from "@/features/game/contracts";

export const APP_NAME = "Quadro" as const;

export const APP_TAGLINE =
  "Türkçe günlük gruplama bulmacası: 16 kelime, 4 gizli bağ, 4 hata hakkı." as const;

/** Oyun kural sabitleri. Tek kaynak: `GAME_CONSTANTS` (src/features/game/contracts.ts). */
export const GAME_RULES = GAME_CONSTANTS;
