import type { EngineConfig } from "./config";
import { applyMove, createGame, ENGINE_VERSION, type GameState, type Move } from "./game";
import { naivePieceSource, SHAPES, type PieceSource, type ShapeId } from "./pieces";
import type { Dictionary } from "./words";

/**
 * Replay: tohum + ayar + hamle listesi oyunun tamamını belirler. Sunucu tarafı skor
 * doğrulaması (#218) aynı fonksiyonu çalıştırır; istemcinin bildirdiği skora güvenmez.
 */
export type ReplayLog = {
  readonly version: string;
  readonly seed: number;
  readonly config: EngineConfig;
  readonly moves: readonly Move[];
};

export type ReplayOutcome =
  | { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly reason: "version-mismatch" | "illegal-move"; readonly moveIndex?: number };

export function replay(log: ReplayLog, dictionary: Dictionary, source: PieceSource = naivePieceSource): ReplayOutcome {
  if (log.version !== ENGINE_VERSION) return { ok: false, reason: "version-mismatch" };
  let state = createGame({ seed: log.seed, config: log.config, source });
  for (const [index, move] of log.moves.entries()) {
    const outcome = applyMove(state, move, dictionary, source);
    if (!outcome.ok) return { ok: false, reason: "illegal-move", moveIndex: index };
    state = outcome.state;
  }
  return { ok: true, state };
}

/** Snapshot: oyun durumunun kendisi. Kayıt dosyası (#208) bunu atomik ve sürümlü yazar. */
export function serializeState(state: GameState): string {
  return JSON.stringify(state);
}

const isInt = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value);

/**
 * Kaydı doğrulayarak geri yükler. Bozuk, eski sürüm ya da tutarsız kayıt `null` döner;
 * çağıran taraf yeni oyun başlatır. Kayıttaki hiçbir değere körü körüne güvenilmez.
 */
export function parseState(raw: string): GameState | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object") return null;
  const s = value as Record<string, unknown>;
  if (s.version !== ENGINE_VERSION) return null;
  const config = s.config as EngineConfig | undefined;
  if (!config || !isInt(config.boardSize) || !isInt(config.trayCapacity) || !isInt(config.minWordLength)) return null;
  const size = config.boardSize;

  const board = s.board;
  if (!Array.isArray(board) || board.length !== size) return null;
  for (const row of board) {
    if (!Array.isArray(row) || row.length !== size) return null;
    if (!row.every((cell) => cell === null || (typeof cell === "string" && [...cell].length === 1))) return null;
  }

  const tray = s.tray;
  if (!Array.isArray(tray) || tray.length !== config.trayCapacity) return null;
  for (const piece of tray) {
    if (!piece || typeof piece !== "object") return null;
    const p = piece as Record<string, unknown>;
    if (!isInt(p.id) || typeof p.shape !== "string" || !(p.shape in SHAPES) || !Array.isArray(p.cells)) return null;
    const offsets = SHAPES[p.shape as ShapeId] as readonly (readonly [number, number])[];
    if (p.cells.length !== offsets.length) return null;
    const cellsOk = p.cells.every((cell: unknown, index: number) => {
      const c = cell as Record<string, unknown> | null;
      const offset = offsets[index];
      return !!c && !!offset && c.dr === offset[0] && c.dc === offset[1] && typeof c.letter === "string" && [...c.letter].length === 1;
    });
    if (!cellsOk) return null;
  }

  for (const field of ["seed", "rng", "nextPieceId", "score", "moveCount", "wordCount"] as const) {
    if (!isInt(s[field]) || (s[field] as number) < 0) return null;
  }
  if (typeof s.over !== "boolean") return null;
  return value as GameState;
}
