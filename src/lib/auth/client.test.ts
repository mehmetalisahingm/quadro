import { describe, expect, it } from "vitest";

import { displayNameForUser, parseImplicitAuthFragment } from "./client";

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
