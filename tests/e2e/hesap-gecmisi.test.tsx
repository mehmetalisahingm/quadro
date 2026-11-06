import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StatsExperience } from "@/components/stats/StatsExperience";
import { AUTH_SESSION_EVENT, AUTH_SESSION_STORAGE_KEY } from "@/lib/auth/client";

const session = { accessToken: "token", refreshToken: "refresh", expiresAt: 9999999999, user: { id: "user-1" } };

beforeEach(() => {
  window.localStorage.clear();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
});
afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("istatistiklerde hesap geçmişi", () => {
  it("hesaba ait sonuçları cihaz istatistiklerinden ayrı gösterir ve çıkışta gizler", async () => {
    window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json([
      { id: "result-1", puzzle_id: "picture-001", result: "won", mistakes_used: 2, played_at: "2026-11-05T12:00:00Z" },
    ])));
    render(<StatsExperience />);
    expect(await screen.findByText("Resimli Quadro · Tahta 1")).toBeTruthy();
    expect(screen.getByText(/bu cihaza aittir/)).toBeTruthy();
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
    await waitFor(() => expect(screen.queryByText("Hesabındaki oyunlar")).toBeNull());
  });

  it("çıkıştan sonra tamamlanan eski isteğin sonucunu göstermez", async () => {
    window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
    let resolve!: (response: Response) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((done) => { resolve = done; })));
    render(<StatsExperience />);
    await screen.findByText("Hesap geçmişin yükleniyor…");
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
    resolve(Response.json([{ id: "old", puzzle_id: "picture-001", result: "won", mistakes_used: 0, played_at: "2026-11-05T12:00:00Z" }]));
    await waitFor(() => expect(screen.queryByText("Hesabındaki oyunlar")).toBeNull());
    expect(screen.queryByText("Resimli Quadro · Tahta 1")).toBeNull();
  });

  it("hesap değişince önceki kullanıcının gecikmiş sonucunu göstermez", async () => {
    window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
    let resolveFirst!: (response: Response) => void;
    const fetcher = vi.fn()
      .mockImplementationOnce(() => new Promise<Response>((done) => { resolveFirst = done; }))
      .mockResolvedValueOnce(Response.json([{ id: "new", puzzle_id: "journey-001", result: "won", mistakes_used: 0, played_at: "2026-11-05T12:00:00Z" }]));
    vi.stubGlobal("fetch", fetcher);
    render(<StatsExperience />);
    await screen.findByText("Hesap geçmişin yükleniyor…");
    window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify({ ...session, user: { id: "user-2" } }));
    window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
    expect(await screen.findByText("Keşif Yolu · Adım 1")).toBeTruthy();
    resolveFirst(Response.json([{ id: "old", puzzle_id: "picture-001", result: "won", mistakes_used: 0, played_at: "2026-11-05T12:00:00Z" }]));
    await waitFor(() => expect(screen.getByText("Keşif Yolu · Adım 1")).toBeTruthy());
    expect(screen.queryByText("Resimli Quadro · Tahta 1")).toBeNull();
  });
});
