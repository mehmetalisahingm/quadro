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
