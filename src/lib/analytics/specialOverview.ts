const MODES = ["risk", "ladder", "bomb"] as const;
type Mode = typeof MODES[number];
export type SpecialModeMetric = { mode: Mode; starts: number; wins: number; losses: number; finishes: number };
export type SpecialModeRecent = { mode: Mode; puzzleId: string; outcome: "won" | "lost"; score: number; attempts: number; mistakes: number; at: string };

/** Admin only: exact counts from coarse, anonymous events in the last 30 days. */
export async function loadSpecialOverview(url: string, secretKey: string, now = new Date()): Promise<{ modes: SpecialModeMetric[]; recent: SpecialModeRecent[] } | null> {
  const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  async function count(mode: Mode, event: "game_start" | "game_finish", status?: "won" | "lost") {
    const query = new URLSearchParams({ select: "id", event_name: `eq.${event}`, "properties->>mode": `eq.${mode}`, occurred_at: `gte.${since}`, limit: "1" });
    if (status) query.set("properties->>status", `eq.${status}`);
    const response = await fetch(`${url}/rest/v1/analytics_events?${query}`, { headers: { apikey: secretKey, prefer: "count=exact" }, cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error("count_unavailable");
    const total = response.headers.get("content-range")?.match(/\/(\d+)$/)?.[1];
    if (total === undefined) throw new Error("count_missing");
    return Number(total);
  }
  async function recent(): Promise<SpecialModeRecent[]> {
    const query = new URLSearchParams({ select: "puzzle_id,properties,occurred_at", event_name: "eq.game_finish", "properties->>mode": "in.(risk,ladder,bomb)", occurred_at: `gte.${since}`, order: "occurred_at.desc", limit: "50" });
    const response = await fetch(`${url}/rest/v1/analytics_events?${query}`, { headers: { apikey: secretKey }, cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error("recent_unavailable");
    const rows: unknown = await response.json();
    if (!Array.isArray(rows)) throw new Error("invalid_recent");
    return rows.flatMap((row: { puzzle_id?: unknown; occurred_at?: unknown; properties?: { mode?: unknown; status?: unknown; score?: unknown; attemptCount?: unknown; mistakesUsed?: unknown } }) => {
      const p = row?.properties;
      if (!p || !MODES.includes(p.mode as Mode) || (p.status !== "won" && p.status !== "lost") || typeof row.puzzle_id !== "string" || typeof row.occurred_at !== "string" || !Number.isInteger(p.score) || !Number.isInteger(p.attemptCount) || !Number.isInteger(p.mistakesUsed)) return [];
      return [{ mode: p.mode as Mode, puzzleId: row.puzzle_id, outcome: p.status, score: p.score as number, attempts: p.attemptCount as number, mistakes: p.mistakesUsed as number, at: row.occurred_at }];
    });
  }
  try {
    const [modes, recentResults] = await Promise.all([Promise.all(MODES.map(async mode => {
      const [starts, wins, losses] = await Promise.all([count(mode, "game_start"), count(mode, "game_finish", "won"), count(mode, "game_finish", "lost")]);
      return { mode, starts, wins, losses, finishes: wins + losses };
    })), recent()]);
    return { modes, recent: recentResults };
  } catch { return null; }
}
