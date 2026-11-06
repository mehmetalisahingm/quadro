"use client";

import type { GameSnapshot } from "@/features/game/contracts";
import { readStoredSession } from "@/lib/auth/client";

export function persistSignedInGameResult(snapshot: GameSnapshot): void {
  if (process.env.NODE_ENV === "test" || typeof window === "undefined") return;
  if (snapshot.status === "playing") return;
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
    body: JSON.stringify({ snapshot }),
  }).catch(() => {
    // Losing connectivity cannot prevent local/offline play.
  });
}
