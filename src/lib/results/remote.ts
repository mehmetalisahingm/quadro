"use client";

import { GAME_CONSTANTS, type GameSnapshot } from "@/features/game/contracts";
import { readStoredSession, type QuadroAuthSession } from "@/lib/auth/client";

function supabaseConfig(): { url: string; publishableKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && publishableKey ? { url, publishableKey } : null;
}

export type AccountGameResult = {
  id: string;
  puzzleId: string;
  result: "won" | "lost";
  mistakes: number;
  playedAt: string;
};

/** Fetch only the signed-in user's latest results. RLS is the authorization boundary. */
export async function loadAccountGameResults(
  session: QuadroAuthSession,
  signal?: AbortSignal,
): Promise<AccountGameResult[]> {
  const config = supabaseConfig();
  if (!config) throw new Error("Hesap bağlantısı yapılandırılmamış.");

  const endpoint = new URL(`${config.url}/rest/v1/game_results`);
  endpoint.searchParams.set("select", "id,puzzle_id,result,mistakes_used,played_at");
  endpoint.searchParams.set("user_id", `eq.${session.user.id}`);
  endpoint.searchParams.set("order", "played_at.desc,id.desc");
  endpoint.searchParams.set("limit", "20");

  const response = await fetch(endpoint, {
    headers: { apikey: config.publishableKey, authorization: `Bearer ${session.accessToken}` },
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error("Hesap geçmişi yüklenemedi.");
  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) throw new Error("Hesap geçmişi okunamadı.");
  return payload.map((item: unknown) => {
    if (!item || typeof item !== "object") throw new Error("Hesap geçmişi okunamadı.");
    const row = item as Record<string, unknown>;
    if (typeof row.id !== "string" || typeof row.puzzle_id !== "string" ||
      (row.result !== "won" && row.result !== "lost") ||
      typeof row.mistakes_used !== "number" || !Number.isInteger(row.mistakes_used) ||
      row.mistakes_used < 0 ||
      typeof row.played_at !== "string" || !Number.isFinite(Date.parse(row.played_at))) {
      throw new Error("Hesap geçmişi okunamadı.");
    }
    return { id: row.id, puzzleId: row.puzzle_id, result: row.result, mistakes: row.mistakes_used, playedAt: row.played_at };
  });
}

export function persistSignedInGameResult(snapshot: GameSnapshot): void {
  if (process.env.NODE_ENV === "test" || typeof window === "undefined") return;
  if (snapshot.status === "playing") return;

  const config = supabaseConfig();
  const session = readStoredSession();
  if (!config || !session || typeof window.fetch !== "function") return;

  const endpoint = new URL(`${config.url}/rest/v1/game_results`);
  endpoint.searchParams.set("on_conflict", "user_id,puzzle_id,puzzle_revision");

  void window.fetch(endpoint.toString(), {
    method: "POST",
    headers: {
      apikey: config.publishableKey,
      authorization: `Bearer ${session.accessToken}`,
      "content-type": "application/json",
      prefer: "resolution=merge-duplicates,return=minimal",
    },
    cache: "no-store",
    body: JSON.stringify({
      user_id: session.user.id,
      puzzle_id: snapshot.puzzleId,
      puzzle_revision: snapshot.puzzleRevision,
      result: snapshot.status,
      attempt_count: snapshot.attempts.length,
      mistakes_used: Math.max(0, GAME_CONSTANTS.maxMistakes - snapshot.mistakesRemaining),
      active_seconds: Math.max(0, Math.floor(snapshot.activeSeconds)),
      played_at: new Date().toISOString(),
    }),
  }).catch(() => {
    // Sonuç senkronizasyonu oyun akışını hiçbir zaman bozmamalı.
  });
}
