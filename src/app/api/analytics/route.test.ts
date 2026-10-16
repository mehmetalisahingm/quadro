import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const VALID_VISITOR = "123e4567-e89b-42d3-a456-426614174000";

function request(body: unknown, contentType = "application/json") {
  return new Request("http://localhost:3000/api/analytics", {
    method: "POST",
    headers: { "content-type": contentType },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/analytics", () => {

  it("rejects a null JSON object instead of crashing", async () => {
    expect((await POST(request(null))).status).toBe(400);
  });

  it("rejects unknown payload fields so words and identity data cannot leak", async () => {
    const response = await POST(request({
      visitorId: VALID_VISITOR,
      event: {
        id: "evt-22", name: "game_start", at: new Date().toISOString(),
        properties: { puzzleId: "q-023", revision: 1, dayKey: "2026-10-12",
          resumed: false, wordIds: ["spoiler"], email: "unwanted@example.invalid" },
      },
    }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_event_properties" });
  });

  it("rejects large chunked bodies without content-length", async () => {
    const large = new Request("http://localhost:3000/api/analytics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ padding: "X".repeat(8_500) }),
    });
    expect((await POST(large)).status).toBe(413);
  });

  it("reports unavailable Supabase transport without exposing a server error", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SECRET_KEY", "server-secret");
    const fakeFetch = vi.fn().mockRejectedValue(new Error("connection refused"));
    vi.stubGlobal("fetch", fakeFetch);
    const response = await POST(request({ visitorId: VALID_VISITOR,
      event: { id: "evt-2", name: "home_view", at: new Date().toISOString(),
        properties: { state: "new", dayKey: "2026-10-12", puzzleAvailable: true } } }));
    expect(response.status).toBe(502);
    expect(fakeFetch).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it("rejects unsupported media types", async () => {
    const response = await POST(request({}, "text/plain"));
    expect(response.status).toBe(415);
  });

  it("rejects malformed visitor ids", async () => {
    const response = await POST(
      request({
        visitorId: "not-a-uuid",
        event: { id: "evt-1", name: "home_view", at: new Date().toISOString(), properties: {} },
      }),
    );
    expect(response.status).toBe(400);
  });

  it("rejects malformed event ids", async () => {
    const response = await POST(
      request({
        visitorId: VALID_VISITOR,
        event: { id: "contains spaces", name: "home_view", at: new Date().toISOString(), properties: {} },
      }),
    );
    expect(response.status).toBe(400);
  });

  it("stays non-blocking when Supabase is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SECRET_KEY", "");

    const response = await POST(
      request({
        visitorId: VALID_VISITOR,
        event: {
          id: "evt-123",
          name: "home_view",
          at: new Date().toISOString(),
          properties: { dayKey: "2026-09-27", puzzleAvailable: true, state: "new" },
        },
      }),
    );

    expect(response.status).toBe(204);
  });
});
