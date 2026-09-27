// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import { currentUserIsAdmin } from "./admin";

describe("currentUserIsAdmin", () => {
  it("oturum yoksa false döner", async () => {
    window.localStorage.clear();
    await expect(currentUserIsAdmin()).resolves.toBe(false);
  });
});
