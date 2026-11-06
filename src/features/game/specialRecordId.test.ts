import { describe, expect, it } from "vitest";
import { specialRecordId } from "./specialRecordId";
describe("special record identity", () => {
  it("separates browser sessions and fits the analytics puzzle identifier limit", () => {
    const a = specialRecordId("ladder", "2026-11-06", "special-9007199254740991-track-balanced-012", "123e4567-e89b-42d3-a456-426614174000");
    const b = specialRecordId("ladder", "2026-11-06", "special-9007199254740991-track-balanced-012", "223e4567-e89b-42d3-a456-426614174000");
    expect(a).not.toBe(b); expect(a.length).toBeLessThanOrEqual(64); expect(a).toContain("track-balanced-012");
  });
});
