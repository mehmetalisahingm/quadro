"use client";

import type { GameSnapshot } from "@/features/game/contracts";
import { readStoredSession } from "@/lib/auth/client";
import type { SpecialMode } from "@/features/game/specialEnergy";
import { makeVisitorId, UUID_V4, VISITOR_ID_STORAGE_KEY } from "@/lib/analytics/remote";

/**
 * Hesaba özel mod sonucu kaydı için cihaz kanıtı. Analitik kimliğinden ayrıdır: yalnız
 * giriş yapmış kullanıcının kendi istediği kayıt için kullanılır (zorunlu kategori),
 * ölçüme gönderilmez ve analitik onayı reddedilince silinmez.
 */
export const RESULT_DEVICE_STORAGE_KEY = "quadro:result-device:v1";

export function getOrCreateResultDeviceId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const storage = window.localStorage;
    const existing = storage.getItem(RESULT_DEVICE_STORAGE_KEY);
    if (existing && UUID_V4.test(existing)) return existing;
    // Eski sürümde aynı amaçla ziyaretçi kimliği kullanılıyordu; bugünkü kayıtlar kopmasın.
    const legacy = storage.getItem(VISITOR_ID_STORAGE_KEY);
    const created = legacy && UUID_V4.test(legacy) ? legacy : makeVisitorId();
    if (!created) return null;
    storage.setItem(RESULT_DEVICE_STORAGE_KEY, created);
    return created;
  } catch {
    return null;
  }
}

export function persistSignedInGameResult(snapshot: GameSnapshot): void {
  if (snapshot.status === "playing") return;
  sendResult(snapshot);
}

export function persistSignedInSpecialResult(snapshot: GameSnapshot, special: { mode: SpecialMode; wagers?: number[]; bombId?: string | null }): void {
  // Giriş yoksa cihaza kimlik yazmanın gereği de yoktur.
  if (typeof window === "undefined" || !readStoredSession()) return;
  const visitorId = getOrCreateResultDeviceId();
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
