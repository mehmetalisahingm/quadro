"use client";

import type { AnalyticsEvent } from "./index";

export const VISITOR_ID_STORAGE_KEY = "quadro:visitor:v1";

function makeVisitorId(): string | null {
  if (typeof crypto === "undefined") return null;

  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  if (typeof crypto.getRandomValues !== "function") return null;

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;

  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function getOrCreateVisitorId(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const existing = window.localStorage.getItem(VISITOR_ID_STORAGE_KEY);
    if (existing) return existing;

    const created = makeVisitorId();
    if (!created) return null;

    window.localStorage.setItem(VISITOR_ID_STORAGE_KEY, created);
    return created;
  } catch {
    return null;
  }
}

export function forwardAnalyticsEvent(event: AnalyticsEvent): void {
  if (process.env.NODE_ENV === "test" || typeof window === "undefined") return;

  const visitorId = getOrCreateVisitorId();
  if (!visitorId || typeof window.fetch !== "function") return;

  void window
    .fetch("/api/analytics", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      credentials: "same-origin",
      cache: "no-store",
      keepalive: true,
      body: JSON.stringify({ visitorId, event }),
    })
    .catch(() => {
      // Merkezi analytics hiçbir zaman oyun akışını bozmamalı.
    });
}
