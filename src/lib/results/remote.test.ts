import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadAccountGameResults } from "./remote";

const session = { accessToken: "user-token", refreshToken: "refresh", expiresAt: 9999999999, user: { id: "user-1" } };

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("hesap oyun geçmişi", () => {
  it("isteği kullanıcı JWT'si ve RLS ile son 20 sonuca sınırlar", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json([
      { id: "result-1", puzzle_id: "journey-001", result: "won", mistakes_used: 1, played_at: "2026-11-05T12:00:00Z" },
    ]));
    vi.stubGlobal("fetch", fetcher);
    const results = await loadAccountGameResults(session);
    expect(results).toEqual([{ id: "result-1", puzzleId: "journey-001", result: "won", mistakes: 1, playedAt: "2026-11-05T12:00:00Z" }]);
    const call = fetcher.mock.calls[0];
    if (!call) throw new Error("Geçmiş isteği gönderilmedi.");
    const [url, options] = call;
    expect(url.searchParams.get("user_id")).toBe("eq.user-1");
    expect(url.searchParams.get("limit")).toBe("20");
    expect(options.headers.authorization).toBe("Bearer user-token");
    expect(options.headers.apikey).toBe("sb_publishable_test");
  });

  it("HTTP veya geçersiz veri hatasını boş geçmiş gibi göstermez", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response("", { status: 401 }))
      .mockResolvedValueOnce(Response.json([{ id: "invalid" }]));
    vi.stubGlobal("fetch", fetcher);
    await expect(loadAccountGameResults(session)).rejects.toThrow("yüklenemedi");
    await expect(loadAccountGameResults(session)).rejects.toThrow("okunamadı");
  });
});
