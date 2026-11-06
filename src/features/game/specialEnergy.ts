/**
 * Özel modların enerji ve skor ekonomisi (#172).
 *
 * - Enerji en fazla 30'dur ve her 60 saniyede 1 artar; 30'dayken zaman biriktirilmez.
 * - Yeni oyun için en az 20 enerji gerekir, girişte 10 düşer (ör. 20 → 10).
 * - Yalnız kazanılan oyun skor alır: 400 − 100 × yanlış tahmin. Kaybedilen veya yarım kalan oyun 0.
 * - Her tam 200 skor için 2 enerji verilir: 400 → +4, 300 → +2, 200 → +2, 100 → +0.
 * - Mod bonusları skordan ayrıdır ve enerji vermez.
 *
 * Durum yalnız bu tarayıcıda tutulur (`localStorage`); hesap veya cihaz eşitlemesi yoktur.
 * Zaman cihaz saatinden okunur; saat geri alınırsa enerji artmaz, ileri alınırsa en fazla
 * 30'a kadar dolar. Gerçek para veya ücretli puan yoktur.
 */

export type SpecialMode = "risk" | "ladder" | "bomb";
export type SpecialRun = { id: number; mode: SpecialMode; slot: number; day: string };
/** Biten bir oyunun ödülü; aynı oyun ikinci kez ödüllendirilmez. */
export type SpecialAward = { runId: number; score: number; energy: number };
export type SpecialState = {
  version: 2;
  energy: number;
  /** Enerji 30'un altındayken bir sonraki +1'in sayıldığı başlangıç anı (ms). */
  updatedAt: number;
  sequence: number;
  active: SpecialRun | null;
  lastAward: SpecialAward | null;
};
/** Biten oyunun motor sonucu: kazanıldı mı ve kaç geçerli yanlış tahmin yapıldı. */
export type SpecialOutcome = { won: boolean; mistakes: number };

export const ENERGY_MAX = 30;
export const ENERGY_COST = 10;
export const ENERGY_TO_START = 20;
export const REFILL_MS = 60 * 1000;
export const SCORE_MAX = 400;
export const SCORE_PER_MISTAKE = 100;
export const SCORE_PER_REWARD = 200;
export const ENERGY_PER_REWARD = 2;
export const SLOT_COUNT = 48;
export const STORAGE_KEY = "quadro:special-energy:v2";
export const LEGACY_STORAGE_KEY = "quadro:special-energy:v1";
export const ENERGY_EVENT = "quadro:special-energy";

const MODES: readonly SpecialMode[] = ["risk", "ladder", "bomb"];

export function initialSpecialState(now: number): SpecialState {
  return { version: 2, energy: ENERGY_MAX, updatedAt: now, sequence: 0, active: null, lastAward: null };
}

/** Kazanılan oyunun temel skoru; kaybedilen oyun ve negatif değer yok. */
export function baseScore({ won, mistakes }: SpecialOutcome): number {
  if (!won) return 0;
  return Math.max(0, SCORE_MAX - SCORE_PER_MISTAKE * Math.max(0, Math.floor(mistakes)));
}

/** Her tam 200 skor için 2 enerji. */
export function energyReward(score: number): number {
  return ENERGY_PER_REWARD * Math.floor(Math.max(0, score) / SCORE_PER_REWARD);
}

/** Geçen tam dakikalar kadar enerji ekler. Saat geri alınmışsa hiçbir şey değişmez. */
export function replenish(state: SpecialState, now: number): SpecialState {
  if (state.energy >= ENERGY_MAX) return state.updatedAt === now ? state : { ...state, energy: ENERGY_MAX, updatedAt: now };
  if (now < state.updatedAt) return state;
  const steps = Math.floor((now - state.updatedAt) / REFILL_MS);
  if (steps === 0) return state;
  const energy = Math.min(ENERGY_MAX, state.energy + steps);
  return { ...state, energy, updatedAt: energy === ENERGY_MAX ? now : state.updatedAt + steps * REFILL_MS };
}

export function canStart(state: SpecialState): boolean {
  return state.active === null && state.energy >= ENERGY_TO_START;
}

/** Yeni oyuna kadar kalan süre (ms); başlanabiliyorsa 0. */
export function msUntilStart(state: SpecialState, now: number): number {
  if (state.energy >= ENERGY_TO_START) return 0;
  const missing = ENERGY_TO_START - state.energy;
  return Math.max(0, state.updatedAt + missing * REFILL_MS - now);
}

/** Sonraki +1 enerjiye kalan süre (ms); enerji doluysa null. */
export function msUntilNextEnergy(state: SpecialState, now: number): number | null {
  if (state.energy >= ENERGY_MAX) return null;
  return Math.max(0, state.updatedAt + REFILL_MS - now);
}

export function beginRun(state: SpecialState, mode: SpecialMode, now: number, day: string): SpecialState | null {
  const current = replenish(state, now);
  if (!canStart(current)) return null;
  const id = current.sequence + 1;
  return {
    ...current,
    energy: current.energy - ENERGY_COST,
    // Doluyken sayaç durur; harcama anında yeniden başlar.
    updatedAt: current.energy >= ENERGY_MAX ? now : current.updatedAt,
    sequence: id,
    active: { id, slot: current.sequence % SLOT_COUNT, mode, day },
    lastAward: null,
  };
}

/** Etkin oyunu bitirir ve ödülü bir kez verir; aynı oyunun ikinci bitişi durumu değiştirmez. */
export function finishRun(state: SpecialState, runId: number, outcome: SpecialOutcome, now: number): SpecialState {
  const current = replenish(state, now);
  if (!current.active || current.active.id !== runId) return current;
  if (!Number.isInteger(outcome.mistakes) || outcome.mistakes < 0) return current;
  const score = baseScore(outcome);
  const reward = energyReward(score);
  const energy = Math.min(ENERGY_MAX, current.energy + reward);
  return {
    ...current,
    energy,
    updatedAt: energy >= ENERGY_MAX ? now : current.updatedAt,
    active: null,
    lastAward: { runId, score, energy: energy - current.energy },
  };
}

function validRun(value: unknown, sequence: number): value is SpecialRun {
  if (!value || typeof value !== "object") return false;
  const run = value as Record<string, unknown>;
  return Number.isSafeInteger(run.id) && run.id === sequence &&
    Number.isInteger(run.slot) && (run.slot as number) >= 0 && (run.slot as number) < SLOT_COUNT &&
    typeof run.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(run.day) &&
    MODES.includes(run.mode as SpecialMode);
}

function validAward(value: unknown): value is SpecialAward {
  if (value === null) return true;
  if (!value || typeof value !== "object") return false;
  const award = value as Record<string, unknown>;
  return Number.isSafeInteger(award.runId) && Number.isInteger(award.score) && (award.score as number) >= 0 &&
    (award.score as number) <= SCORE_MAX && Number.isInteger(award.energy) && (award.energy as number) >= 0 &&
    (award.energy as number) <= ENERGY_MAX;
}

/** Ortak alan denetimi; geçersiz kayıt başlangıç durumuna döner. */
function validCore(x: Record<string, unknown>): boolean {
  return Number.isInteger(x.energy) && (x.energy as number) >= 0 && (x.energy as number) <= ENERGY_MAX &&
    Number.isFinite(x.updatedAt) && Number.isSafeInteger(x.sequence) && (x.sequence as number) >= 0 &&
    (x.active === null || validRun(x.active, x.sequence as number));
}

export function parseSpecialState(raw: string | null, now: number): SpecialState {
  if (!raw) return initialSpecialState(now);
  try {
    const x: unknown = JSON.parse(raw);
    if (!x || typeof x !== "object") return initialSpecialState(now);
    const record = x as Record<string, unknown>;
    if (record.version !== 2 || !validCore(record) || !validAward(record.lastAward)) return initialSpecialState(now);
    return replenish({
      version: 2,
      energy: record.energy as number,
      updatedAt: record.updatedAt as number,
      sequence: record.sequence as number,
      active: record.active as SpecialRun | null,
      lastAward: record.lastAward as SpecialAward | null,
    }, now);
  } catch {
    return initialSpecialState(now);
  }
}

/**
 * Eski (v1) kaydı taşır: enerji, oyun sırası ve yarım kalan oyun korunur; kaldırılan üç oyun
 * hedefinin sonuçları ve ödülü düşer. Eski kayıt bozuksa null döner.
 */
export function migrateLegacyState(raw: string | null, now: number): SpecialState | null {
  if (!raw) return null;
  try {
    const x: unknown = JSON.parse(raw);
    if (!x || typeof x !== "object") return null;
    const record = x as Record<string, unknown>;
    if (!validCore(record)) return null;
    return replenish({
      version: 2,
      energy: record.energy as number,
      // Eski sayaç 10 dakikalıktı; dakikalık sayaç eski başlangıçtan devam eder.
      updatedAt: Math.min(now, record.updatedAt as number),
      sequence: record.sequence as number,
      active: record.active as SpecialRun | null,
      lastAward: null,
    }, now);
  } catch {
    return null;
  }
}

export function readSpecialState(now = Date.now()): SpecialState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw !== null) return parseSpecialState(raw, now);
  const migrated = migrateLegacyState(localStorage.getItem(LEGACY_STORAGE_KEY), now);
  if (!migrated) return initialSpecialState(now);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  return migrated;
}

export function saveSpecialState(state: SpecialState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(ENERGY_EVENT));
}

/** Süreyi `m:ss` biçimine getirir. */
export function formatCountdown(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
