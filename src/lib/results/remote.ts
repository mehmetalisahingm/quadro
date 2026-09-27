"use client";

import { GAME_CONSTANTS, type GameSnapshot } from "@/features/game/contracts";
import { readStoredSession } from "@/lib/auth/client";

function supabaseConfig(): { url: string; publishableKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && publishableKey ? { url, publishableKey } : null;
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
