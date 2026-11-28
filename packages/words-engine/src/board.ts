/**
 * Tahta temel tipleri. Kurallar (#205) bu sözleşmenin üstüne yazılacak:
 * 7×7 sabit tahta, boş hücre `null`, dolu hücre tek bir harf.
 */
export const BOARD_SIZE = 7;

export type Letter = string;
export type Cell = Letter | null;
export type Board = readonly (readonly Cell[])[];
export type Position = { readonly row: number; readonly col: number };

export function createBoard(size = BOARD_SIZE): Board {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => null));
}

export function isInside(board: Board, { row, col }: Position): boolean {
  return row >= 0 && col >= 0 && row < board.length && col < (board[row]?.length ?? 0);
}

export function cellAt(board: Board, position: Position): Cell {
  return isInside(board, position) ? (board[position.row]?.[position.col] ?? null) : null;
}

export function countFilled(board: Board): number {
  return board.reduce((total, row) => total + row.filter((cell) => cell !== null).length, 0);
}
