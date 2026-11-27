import { describe, expect, it } from "vitest";
import { resolveAdSlot } from "./config";

const ready = { environment: "production", enabled: "true", cmpReady: "true", slot: "1234567890" };

describe("AdSense launch guard", () => {
  it("defaults to off", () => expect(resolveAdSlot({})).toBeNull());
  it("does not enable ads in preview", () => expect(resolveAdSlot({ ...ready, environment: "preview" })).toBeNull());
  it("requires explicit activation", () => expect(resolveAdSlot({ ...ready, enabled: "false" })).toBeNull());
  it("requires configured consent management", () => expect(resolveAdSlot({ ...ready, cmpReady: undefined })).toBeNull());
  it("rejects missing or invalid ad slots", () => {
    expect(resolveAdSlot({ ...ready, slot: undefined })).toBeNull();
    expect(resolveAdSlot({ ...ready, slot: "bad" })).toBeNull();
  });
  it("accepts a configured production ad unit", () => expect(resolveAdSlot(ready)).toBe(ready.slot));
});
