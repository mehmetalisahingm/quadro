export type SpecialMode = "risk" | "ladder" | "bomb";
export type SpecialRun = { id: number; mode: SpecialMode; slot: number; day: string };
export type SpecialState = { energy: number; updatedAt: number; sequence: number; active: SpecialRun | null; results: number[]; lastAward: number | null; };
export const ENERGY_MAX = 30;
export const ENERGY_COST = 10;
export const REFILL_MS = 10 * 60 * 1000;
export const GOAL = 1500;
export const STORAGE_KEY = "quadro:special-energy:v1";

export function initialSpecialState(now: number): SpecialState { return { energy: ENERGY_MAX, updatedAt: now, sequence: 0, active: null, results: [], lastAward: null }; }
export function replenish(state: SpecialState, now: number): SpecialState {
  if (now < state.updatedAt) return { ...state, updatedAt: now };
  if (state.energy >= ENERGY_MAX) return { ...state, updatedAt: now };
  const steps = Math.floor((now - state.updatedAt) / REFILL_MS);
  if (!steps) return state;
  const energy = Math.min(ENERGY_MAX, state.energy + steps * ENERGY_COST);
  return { ...state, energy, updatedAt: energy === ENERGY_MAX ? now : state.updatedAt + steps * REFILL_MS };
}
export function beginRun(state: SpecialState, mode: SpecialMode, now: number, day: string): SpecialState | null {
  const current = replenish(state, now);
  if (current.active || current.energy < ENERGY_COST) return null;
  return { ...current, energy: current.energy - ENERGY_COST, updatedAt: current.energy === ENERGY_MAX ? now : current.updatedAt, sequence: current.sequence + 1, active: { id: current.sequence + 1, slot: current.sequence % 48, mode, day }, lastAward: null };
}
export function finishRun(state: SpecialState, runId: number, points: number, now: number): SpecialState {
  const current = replenish(state, now);
  if (!current.active || current.active.id !== runId || !Number.isInteger(points) || points < 0 || points > 10000) return current;
  const results = [...current.results, points];
  if (results.length < 3) return { ...current, active: null, results, lastAward: null };
  const total = results.reduce((sum, n) => sum + n, 0);
  return { ...current, active: null, results: [], lastAward: total, energy: total >= GOAL ? ENERGY_MAX : current.energy, updatedAt: total >= GOAL ? now : current.updatedAt };
}
export function parseSpecialState(raw: string | null, now: number): SpecialState {
  if (!raw) return initialSpecialState(now);
  try {
    const x: unknown = JSON.parse(raw);
    if (!x || typeof x !== "object") return initialSpecialState(now);
    const s = x as SpecialState;
    if (!Number.isInteger(s.energy) || s.energy < 0 || s.energy > ENERGY_MAX || s.energy % 10 !== 0 || !Number.isFinite(s.updatedAt) || !Number.isSafeInteger(s.sequence) || s.sequence < 0 || !Array.isArray(s.results) || s.results.length > 2 || s.results.some(n => !Number.isInteger(n) || n < 0 || n > 10000) || !(s.lastAward === null || (Number.isInteger(s.lastAward) && s.lastAward >= 0 && s.lastAward <= 30000))) return initialSpecialState(now);
    if (s.active !== null && (!s.active || !Number.isSafeInteger(s.active.id) || s.active.id !== s.sequence || !Number.isInteger(s.active.slot) || s.active.slot < 0 || s.active.slot >= 48 || typeof s.active.day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s.active.day) || !["risk", "ladder", "bomb"].includes(s.active.mode))) return initialSpecialState(now);
    return replenish(s, now);
  } catch { return initialSpecialState(now); }
}
export function readSpecialState(now = Date.now()): SpecialState { return parseSpecialState(localStorage.getItem(STORAGE_KEY), now); }
export function saveSpecialState(state: SpecialState): void { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); window.dispatchEvent(new Event("quadro:special-energy")); }

