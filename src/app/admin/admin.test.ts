import { describe, expect, it } from "vitest";

import { currentUserIsAdmin } from "@/lib/auth/admin";

describe("admin auth helper", () => {
  it("returns false without a browser session", async () => {
    await expect(currentUserIsAdmin()).resolves.toBe(false);
  });
});
