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
  it("rejects invalid special mode and score payloads", async () => {
    const event = { id: "evt-1", name: "game_finish", at: new Date().toISOString(), properties: { puzzleId: "p", revision: 1, dayKey: "2026-11-06", status: "won", attemptCount: 4, mistakesUsed: 0, activeSeconds: 0, mode: "invalid", score: 500 } };
    expect((await POST(request({ visitorId: VALID_VISITOR, event }))).status).toBe(400);
    expect((await POST(request({ visitorId: VALID_VISITOR, event: { ...event, properties: { ...event.properties, mode: "bomb", score: -1 } } }))).status).toBe(400);
  });
  it.each([null, [], "text", 1])("rejects non-object JSON without throwing: %j", async value => {
    expect((await POST(request(value))).status).toBe(400);
  });

  it.each([undefined, "1"])("limits streamed UTF-8 bytes even with missing or false content length: %s", async contentLength => {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (contentLength) headers["content-length"] = contentLength;
    const incoming = new Request("https://example.test/api/analytics", {
      method: "POST", headers, body: JSON.stringify({ text: "ş".repeat(5000) }),
    });
    expect((await POST(incoming)).status).toBe(413);
  });

  it("returns a controlled response on database network failure", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://database.example.test");
    vi.stubEnv("SUPABASE_SECRET_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("private network detail")));
    const response = await POST(request({ visitorId: VALID_VISITOR, event: {
      id: "evt-offline", name: "home_view", at: new Date().toISOString(), properties: {},
    } }));
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("private network detail");
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

describe("anonymous progress analytics privacy checks", () => {
  it("rejects answer and identity fields before writing", async () => {
    const response = await POST(request({
      visitorId: VALID_VISITOR,
      event: {
        id: "evt-p1", name: "game_progress", at: new Date().toISOString(),
        properties: { puzzleId: "track-easy-001", revision: 1, dayKey: "2026-11-02", solvedGroups: 1,
          attemptCount: 2, mistakesRemaining: 3, activeSeconds: 14, selectedWordIds: ["secret"] },
      },
    }));
    expect(response.status).toBe(400);
  });

  it("rejects impossible progress numbers", async () => {
    const response = await POST(request({
      visitorId: VALID_VISITOR,
      event: {
        id: "evt-p2", name: "game_progress", at: new Date().toISOString(),
        properties: { puzzleId: "track-easy-001", revision: 1, dayKey: "2026-11-02", solvedGroups: 5,
          attemptCount: 1, mistakesRemaining: 4, activeSeconds: 14 },
      },
    }));
    expect(response.status).toBe(400);
  });

  it("switches off all remote collection with the environment kill switch", async () => {
    vi.stubEnv("QUADRO_ANALYTICS_DISABLED", "1");
    const response = await POST(request({
      visitorId: VALID_VISITOR,
      event: {
        id: "evt-p3", name: "game_progress", at: new Date().toISOString(),
        properties: { puzzleId: "track-easy-001", revision: 1, dayKey: "2026-11-02", solvedGroups: 1,
          attemptCount: 1, mistakesRemaining: 4, activeSeconds: 14 },
      },
    }));
    expect(response.status).toBe(204);
  });
});

describe("campaign source privacy", () => {
  it("accepts safe UTM labels in retention events without a configured database", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    const response = await POST(request({
      visitorId: VALID_VISITOR,
      event: {
        id: "evt-utm-1", name: "retention_visit", at: new Date().toISOString(),
        properties: {
          cohortDay: "2026-11-10", activeDay: "2026-11-10",
          dayOffset: 0, milestone: "D0", utmSource: "player_share",
          utmMedium: "referral", utmCampaign: "result_card",
        },
      },
    }));
    expect(response.status).toBe(204);
  });

  it("rejects UTM values that might leak private information", async () => {
    const response = await POST(request({
      visitorId: VALID_VISITOR,
      event: {
        id: "evt-utm-2", name: "retention_visit", at: new Date().toISOString(),
        properties: { utmSource: "person@example.com" },
      },
    }));
    expect(response.status).toBe(400);
  });
});
