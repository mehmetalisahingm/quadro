import { afterEach, describe, expect, it, vi } from "vitest";
import { getOrCreateVisitorId, VISITOR_ID_STORAGE_KEY } from "./remote";

afterEach(() => vi.unstubAllGlobals());

function storage(initial: string | null = null) {
  const entries = new Map<string,string>();
  if (initial !== null) entries.set(VISITOR_ID_STORAGE_KEY,initial);
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => { entries.set(key,value); },
  };
}

describe("anonymous analytics visitor id", () => {
  it("keeps an existing valid UUID v4", () => {
    const valid = "123e4567-e89b-42d3-a456-426614174000";
    vi.stubGlobal("window", { localStorage: storage(valid) });
    expect(getOrCreateVisitorId()).toBe(valid);
  });
  it("repairs an invalid persisted visitor id", () => {
    const expected = "123e4567-e89b-42d3-a456-426614174000";
    const localStorage = storage("malformed-or-poisoned");
    vi.stubGlobal("window", { localStorage });
    vi.stubGlobal("crypto", { randomUUID: () => expected });
    expect(getOrCreateVisitorId()).toBe(expected);
    expect(localStorage.getItem(VISITOR_ID_STORAGE_KEY)).toBe(expected);
  });
  it("returns null if secure randomness is unavailable", () => {
    vi.stubGlobal("window", { localStorage: storage("bad") });
    vi.stubGlobal("crypto", {});
    expect(getOrCreateVisitorId()).toBeNull();
  });
});
