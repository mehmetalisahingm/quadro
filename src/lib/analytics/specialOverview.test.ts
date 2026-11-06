import { afterEach, describe, expect, it, vi } from "vitest";
import { loadSpecialOverview } from "./specialOverview";
afterEach(() => vi.unstubAllGlobals());
describe("special mode overview", () => {
  it("counts starts and finished wins/losses separately for each mode", async () => {
    const fetcher = vi.fn().mockImplementation(async (url: string) => {
      const query = new URL(url).searchParams;
      if (query.get("select") === "puzzle_id,properties,occurred_at") return Response.json([{ puzzle_id:"s:bomb:board", occurred_at:"2026-11-05T12:00:00Z", properties:{ mode:"bomb", status:"won", score:500, attemptCount:4, mistakesUsed:0 } }]);
      const count = query.get("event_name") === "eq.game_start" ? 7 : query.get("properties->>status") === "eq.won" ? 3 : 2;
      return new Response("[]", { status:200, headers: { "content-range": `0-0/${count}` } });
    });
    vi.stubGlobal("fetch", fetcher);
    const rows = await loadSpecialOverview("https://db.example.test", "secret", new Date("2026-11-06T00:00:00Z"));
    expect(fetcher).toHaveBeenCalledTimes(10);
    expect(rows).toEqual({ modes: ["risk", "ladder", "bomb"].map(mode => ({ mode, starts:7, wins:3, losses:2, finishes:5 })), recent: [{ mode:"bomb", puzzleId:"s:bomb:board", outcome:"won", score:500, attempts:4, mistakes:0, at:"2026-11-05T12:00:00Z" }] });
    expect(new URL(fetcher.mock.calls[0]![0] as string).searchParams.get("occurred_at")).toContain("2026-10-07");
  });
  it("returns unavailable instead of fake zeros if a count fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("failure", { status:503 })));
    expect(await loadSpecialOverview("https://db.example.test", "secret")).toBeNull();
  });
});
