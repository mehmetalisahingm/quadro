import { afterEach, describe, expect, it, vi } from "vitest";

import {
  displayNameForUser,
  parseImplicitAuthFragment,
  sendMagicLink,
} from "./client";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("parseImplicitAuthFragment", () => {
  it("parses Supabase implicit callback tokens", () => {
    expect(
      parseImplicitAuthFragment(
        "#access_token=access-123&refresh_token=refresh-456&expires_at=1999999999&token_type=bearer",
      ),
    ).toEqual({
      accessToken: "access-123",
      refreshToken: "refresh-456",
      expiresAt: 1999999999,
    });
  });

  it("rejects fragments without both tokens", () => {
    expect(parseImplicitAuthFragment("#access_token=only-access")).toBeNull();
    expect(parseImplicitAuthFragment("")).toBeNull();
  });
});

describe("Supabase modern API key headers", () => {
  it("sends sb_publishable key only as apikey for magic-link requests", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");

    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await sendMagicLink("mehmet@example.com");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    const headers = init?.headers as Record<string, string> | undefined;
    expect(headers?.apikey).toBe("sb_publishable_test");
    expect(headers?.authorization).toBeUndefined();
  });
});

describe("displayNameForUser", () => {
  it("prefers profile metadata", () => {
    expect(
      displayNameForUser({
        id: "user-1",
        email: "mehmet@example.com",
        user_metadata: { full_name: "Mehmet Şahin" },
      }),
    ).toBe("Mehmet Şahin");
  });

  it("falls back to the email prefix", () => {
    expect(displayNameForUser({ id: "user-2", email: "mehmet@example.com" })).toBe("mehmet");
  });
});
