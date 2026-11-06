"use client";

import type { GameSnapshot } from "@/features/game/contracts";
import { readStoredSession } from "@/lib/auth/client";
import type { SpecialMode } from "@/features/game/specialEnergy";
import { getOrCreateVisitorId } from "@/lib/analytics/remote";

export function persistSignedInGameResult(snapshot: GameSnapshot): void {
  if (snapshot.status === "playing") return;
  sendResult(snapshot);
}

export function persistSignedInSpecialResult(snapshot: GameSnapshot, special: { mode: SpecialMode; wagers?: number[]; bombId?: string | null }): void {
  const visitorId = getOrCreateVisitorId();
  if (visitorId) sendResult(snapshot, { ...special, visitorId });
}

function sendResult(snapshot: GameSnapshot, special?: { mode: SpecialMode; wagers?: number[]; bombId?: string | null; visitorId: string }): void {
  if (process.env.NODE_ENV === "test" || typeof window === "undefined") return;
  const session = readStoredSession();
  if (!session || typeof window.fetch !== "function") return;

  // Only the server may derive a trusted result and write with service-role
  // credentials. Never trust a browser-supplied "won" / score alone.
  void window.fetch("/api/game-results", {
    method: "POST",
    headers: {
      authorization: `Bearer ${session.accessToken}`,
      "content-type": "application/json",
    },
    credentials: "same-origin",
    cache: "no-store",
    body: JSON.stringify({ snapshot, ...(special ? { special } : {}) }),
  }).catch(() => {
    // Losing connectivity cannot prevent local/offline play.
  });
}
