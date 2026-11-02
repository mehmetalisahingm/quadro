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
});

describe("POST /api/analytics", () => {
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
