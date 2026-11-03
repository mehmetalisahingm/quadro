// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import { currentUserIsAdmin } from "./admin";
import { AUTH_SESSION_STORAGE_KEY } from "./client";
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); window.localStorage.clear(); });

describe("currentUserIsAdmin", () => {
  it("fails closed when authorization cannot reach the server", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-public");
    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify({
      accessToken: "test-access", refreshToken: "test-refresh", expiresAt: 1999999999, user: { id: "test-user" },
    }));
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("Timed out", "TimeoutError")));
    await expect(currentUserIsAdmin()).resolves.toBe(false);
  });
  it("oturum yoksa false döner", async () => {
    window.localStorage.clear();
    await expect(currentUserIsAdmin()).resolves.toBe(false);
  });
});
