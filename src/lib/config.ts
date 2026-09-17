import { GAME_CONSTANTS } from "@/features/game/contracts";

export const APP_NAME = "Quadro" as const;

export const APP_TITLE = "Quadro — Türkçe günlük bağlantı bulmacası" as const;

export const APP_TAGLINE =
  "Türkçe günlük gruplama bulmacası: 16 kelime, 4 gizli bağ, 4 hata hakkı." as const;

export const PLAY_DESCRIPTION =
  "Bugünün 16 kelimesi arasındaki dört gizli bağı bul. Dört hata hakkın var." as const;

export const TUTORIAL_DESCRIPTION =
  "Quadro'nun kısa öğreticisini dene; günlük oyundan bağımsız iki örnek grubu çöz." as const;

export const SOCIAL_IMAGE_ALT =
  "Quadro — 16 kelime ve dört gizli bağı temsil eden soyut 4×4 kart düzeni" as const;

export const BRAND_COLORS = {
  canvas: "#F6F3EE",
  surface: "#FFFEFB",
  ink: "#20242D",
  mutedInk: "#626A78",
  yellow: "#F2CF62",
  green: "#8AC79A",
  blue: "#8ABBD7",
  purple: "#B8A3DE",
} as const;

/** Oyun kural sabitleri. Tek kaynak: `GAME_CONSTANTS` (src/features/game/contracts.ts). */
export const GAME_RULES = GAME_CONSTANTS;
