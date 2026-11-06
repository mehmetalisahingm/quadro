import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { standardPuzzle } from "@/features/game/fixtures/puzzles";
import { createInitialSnapshot, submitSelection, toggleWord } from "@/features/game/engine";
import { POST } from "./route";

vi.mock("@/lib/daily/playableDaily", () => ({
  loadPlayableDaily: vi.fn(async ({ dayKey }: { dayKey: string }) => ({
    status: "ok", dayKey, puzzle: standardPuzzle, source: "test",
  })),
}));

const userId = "11111111-1111-4111-8111-111111111111";
function complete() {
  let state = createInitialSnapshot(standardPuzzle, { random: () => 0.5 });
  for (const group of standardPuzzle.groups) {
    for (const word of group.words) state = toggleWord(standardPuzzle, state, word.id);
    state = submitSelection(standardPuzzle, state).snapshot;
  }
  return state;
}
function request(snapshot: unknown, token = "Bearer valid-user-token", origin = "https://example.test") {
  return new Request("https://example.test/api/game-results", {
    method: "POST", headers: { "content-type": "application/json", authorization: token, origin },
    body: JSON.stringify({ snapshot }),
  });
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://db.example.test");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "public-key");
  vi.stubEnv("SUPABASE_SECRET_KEY", "server-secret");
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("authenticated server result submission", () => {
  it("does not touch the database without a JWT or across a foreign Origin", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    expect((await POST(request(complete(), ""))).status).toBe(401);
    expect((await POST(request(complete(), "Bearer token", "https://evil.example"))).status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("derives winner and owner server-side, never trusting arbitrary userId", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ id: userId }))
      .mockResolvedValueOnce(new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", fetcher);
    const response = await POST(request({ ...complete(), user_id: "attacker", result: "lost" }));
    expect(response.status).toBe(202);
    expect(fetcher).toHaveBeenCalledTimes(2);
    const payload = JSON.parse(fetcher.mock.calls[1]![1].body as string);
    expect(payload).toMatchObject({
      user_id: userId, puzzle_id: standardPuzzle.id,
      result: "won", attempt_count: 4, mistakes_used: 0,
    });
    expect(fetcher.mock.calls[1]![1].headers.apikey).toBe("server-secret");
    expect(fetcher.mock.calls[1]![1].headers.prefer).toContain("ignore-duplicates");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("rejects fake winners without a database write", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ id: userId }));
    vi.stubGlobal("fetch", fetcher);
    const response = await POST(request({ ...complete(), attempts: [] }));
    expect(response.status).toBe(400);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("rejects invalid JWT before touching game data", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ message: "Invalid token" }, { status: 401 }));
    vi.stubGlobal("fetch", fetcher);
    expect((await POST(request(complete()))).status).toBe(401);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
