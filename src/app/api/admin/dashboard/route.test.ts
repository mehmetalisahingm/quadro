import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
const request = () => new Request("https://example.test/api/admin/dashboard", { headers: { authorization: "Bearer test-token" } });
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://database.example.test");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-public");
  vi.stubEnv("SUPABASE_SECRET_KEY", "test-secret");
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("admin dashboard failure isolation", () => {
  it("returns a controlled 502 on database network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("private database detail")));
    const response = await GET(request());
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("private database detail");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("does not query private data before admin authorization succeeds", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(false));
    vi.stubGlobal("fetch", fetcher);
    expect((await GET(request())).status).toBe(403);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("rejects malformed authorization responses without querying private data", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("not json"));
    vi.stubGlobal("fetch", fetcher);
    expect((await GET(request())).status).toBe(502);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
