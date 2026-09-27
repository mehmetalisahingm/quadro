"use client";

import { loadPersonalStats } from "@/lib/persistence/statsStore";

import type { QuadroAuthSession } from "./client";
import { getOrCreateVisitorId } from "../analytics/remote";

const ACCOUNT_SYNC_PREFIX = "quadro:account-sync:v1";

export type AccountSyncStatus = "synced" | "unchanged" | "skipped" | "failed";

function markerKey(userId: string): string {
  return `${ACCOUNT_SYNC_PREFIX}:${userId}`;
}

function payloadFingerprint(visitorId: string): string {
  const results = loadPersonalStats().results;
  return JSON.stringify({ visitorId, results });
}

export async function syncAccountData(session: QuadroAuthSession): Promise<AccountSyncStatus> {
  if (typeof window === "undefined") return "skipped";

  const visitorId = getOrCreateVisitorId();
  if (!visitorId) return "skipped";

  const stats = loadPersonalStats();
  const fingerprint = payloadFingerprint(visitorId);

  try {
    if (window.localStorage.getItem(markerKey(session.user.id)) === fingerprint) {
      return "unchanged";
    }
  } catch {
    // Marker okunamasa da idempotent server sync yapılabilir.
  }

  try {
    const response = await window.fetch("/api/account/sync", {
      method: "POST",
      headers: {
        authorization: `Bearer ${session.accessToken}`,
        "content-type": "application/json",
      },
      credentials: "same-origin",
      cache: "no-store",
      body: JSON.stringify({
        visitorId,
        results: stats.results,
      }),
    });

    if (!response.ok) return "failed";

    try {
      window.localStorage.setItem(markerKey(session.user.id), fingerprint);
    } catch {
      // Sync başarılı; marker yazılamaması veriyi geçersiz kılmaz.
    }

    return "synced";
  } catch {
    return "failed";
  }
}
