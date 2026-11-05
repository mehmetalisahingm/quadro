/**
 * Oyun modu ayrımı (#152). Risk modu da aynı birleşime kendi değerini ekleyerek
 * kayıt anahtarını ve sunum etiketini buradan alabilir. Saf veridir; oyun kuralı
 * taşımaz, motor modları bilmez.
 */

export const GAME_MODES = {
  classic: { label: "Quadro", cardNoun: "kelime" },
  picture: { label: "Resimli Quadro", cardNoun: "görsel" },
} as const;

export type GameMode = keyof typeof GAME_MODES;

const PICTURE_ID_PATTERN = /^picture-\d{3}$/;

/** Bulmaca kimliğinin ait olduğu mod; tanınmayan kimlikler klasik sayılır. */
export function gameModeOf(puzzleId: string): GameMode {
  return PICTURE_ID_PATTERN.test(puzzleId) ? "picture" : "classic";
}

/** Mod, bulmaca ve içerik sürümüne özgü kayıt anahtarı; modlar birbirinin kaydını okuyamaz. */
export function modeStorageKey(mode: GameMode, puzzleId: string, revision: number, name: string): string {
  return `quadro:modes:v1:${mode}:${puzzleId}:r${revision}:${name}`;
}
