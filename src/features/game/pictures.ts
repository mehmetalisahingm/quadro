import type { GameDifficulty } from "./difficulty";

/** Üç örnek tahta; kimlik, gün ve revizyon `src/content/pictures/` ile birebir eşleşir. */
export const PICTURE_BOARDS = [
  { board: 1, label: "Kolay", difficulty: "easy", day: "2026-11-01", revision: 1, note: "Tanıdık nesneler, açık bağlar." },
  { board: 2, label: "Orta", difficulty: "medium", day: "2026-11-02", revision: 1, note: "Bağ, nesnenin ne işe yaradığında." },
  { board: 3, label: "Zor", difficulty: "hard", day: "2026-11-03", revision: 1, note: "Ortak özelliklere ve nesnelerin adlarına bak." },
] as const satisfies readonly { board: number; label: string; difficulty: GameDifficulty; day: string; revision: number; note: string }[];

export const PICTURE_BOARD_COUNT = PICTURE_BOARDS.length;

export function pictureId(board: number): string {
  return `picture-${String(board).padStart(3, "0")}`;
}

export function pictureBoardNumber(id: string): number | null {
  const match = /^picture-(\d{3})$/.exec(id);
  const board = match ? Number(match[1]) : 0;
  return board >= 1 && board <= PICTURE_BOARD_COUNT ? board : null;
}

export function pictureHref(board: number): string {
  return `/pictures/board?board=${board}`;
}
