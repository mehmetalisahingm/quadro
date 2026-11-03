import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_SESSION_STORAGE_KEY, readStoredSession, refreshStoredSession, signOut } from "./client";
import { createMemoryStorage } from "@/lib/persistence/storage";

const old = { accessToken: "old-access", refreshToken: "old-refresh", expiresAt: 1, user: { id: "user-one" } };
const next = { access_token: "new-access", refresh_token: "new-refresh", expires_in: 3600, user: old.user };
let storage: ReturnType<typeof createMemoryStorage>;
beforeEach(() => {
  storage = createMemoryStorage({ [AUTH_SESSION_STORAGE_KEY]: JSON.stringify(old) });
  vi.stubGlobal("window", { localStorage: storage, dispatchEvent: vi.fn() });
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("session recovery", () => {
  it("shares one refresh request across concurrent callers", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(next));
    vi.stubGlobal("fetch", fetcher);
    const sessions = await Promise.all([refreshStoredSession(), refreshStoredSession(), refreshStoredSession()]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(sessions.every(s => s?.refreshToken === "new-refresh")).toBe(true);
  });
  it.each([429, 500, 503])("preserves the recoverable session on transient status %i", async status => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status })));
    expect(await refreshStoredSession()).toEqual(old);
    expect(readStoredSession()).toEqual(old);
  });
  it("retries after an offline failure", async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new TypeError("offline")).mockResolvedValueOnce(Response.json(next));
    vi.stubGlobal("fetch", fetcher);
    expect(await refreshStoredSession()).toEqual(old);
    expect((await refreshStoredSession())?.accessToken).toBe("new-access");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("clears a permanently rejected refresh token", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 401 })));
    expect(await refreshStoredSession()).toBeNull();
    expect(readStoredSession()).toBeNull();
  });
  it("does not overwrite a session refreshed by another tab", async () => {
    let finish!: (value: Response) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(resolve => { finish = resolve; })));
    const pending = refreshStoredSession();
    const other = { ...old, accessToken: "other-tab", refreshToken: "other-refresh" };
    storage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(other));
    finish(new Response("{}", { status: 401 }));
    expect(await pending).toEqual(other);
    expect(readStoredSession()).toEqual(other);
  });
  it("signs out immediately and never restores a late refresh", async () => {
    let finish!: (value: Response) => void;
    vi.stubGlobal("fetch", vi.fn((url: string) => url.includes("refresh_token") ?
      new Promise<Response>(resolve => { finish = resolve; }) : Promise.resolve(new Response("{}"))));
    const pending = refreshStoredSession();
    await signOut();
    expect(readStoredSession()).toBeNull();
    finish(Response.json(next));
    expect(await pending).toBeNull();
    expect(readStoredSession()).toBeNull();
  });
});
