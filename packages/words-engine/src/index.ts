/** Motorun sürümü: snapshot ve replay kayıtları bu değeri taşır. */
export const ENGINE_VERSION = "0.0.0";

export { BOARD_SIZE, cellAt, countFilled, createBoard, isInside } from "./board";
export type { Board, Cell, Letter, Position } from "./board";
export { createRandom, seedFromString } from "./random";
export type { Random } from "./random";
