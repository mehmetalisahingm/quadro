import { afterEach, describe, expect, it, vi } from "vitest";
import { getOrCreateVisitorId, VISITOR_ID_STORAGE_KEY } from "./remote";
import { createMemoryStorage } from "@/lib/persistence/storage";
import { CONSENT_STORAGE_KEY } from "@/lib/consent";

// Ziyaretçi kimliği yalnız analitik onayından sonra oluşur.
const granted = { [CONSENT_STORAGE_KEY]: JSON.stringify({ version: 1, analytics: true, ads: false, decidedAt: new Date().toISOString() }) };
afterEach(() => vi.unstubAllGlobals());
describe("anonymous visitor recovery", () => {
  it("replaces a corrupt visitor identifier instead of dropping every future event", () => {
    const storage = createMemoryStorage({ ...granted, [VISITOR_ID_STORAGE_KEY]: "broken" });
    vi.stubGlobal("window", { localStorage: storage });
    const id = getOrCreateVisitorId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(storage.getItem(VISITOR_ID_STORAGE_KEY)).toBe(id);
    expect(getOrCreateVisitorId()).toBe(id);
  });
  it("preserves an existing valid identifier", () => {
    const id = "123e4567-e89b-42d3-a456-426614174000";
    vi.stubGlobal("window", { localStorage: createMemoryStorage({ ...granted, [VISITOR_ID_STORAGE_KEY]: id }) });
    expect(getOrCreateVisitorId()).toBe(id);
  });
  it("onay yokken ya da reddedilmişken kimlik oluşturmaz ve yazmaz", () => {
    const undecided = createMemoryStorage({});
    vi.stubGlobal("window", { localStorage: undecided });
    expect(getOrCreateVisitorId()).toBeNull();
    expect(undecided.getItem(VISITOR_ID_STORAGE_KEY)).toBeNull();

    const rejected = createMemoryStorage({ [CONSENT_STORAGE_KEY]: JSON.stringify({ version: 1, analytics: false, ads: false, decidedAt: new Date().toISOString() }) });
    vi.stubGlobal("window", { localStorage: rejected });
    expect(getOrCreateVisitorId()).toBeNull();
    expect(rejected.getItem(VISITOR_ID_STORAGE_KEY)).toBeNull();
  });
});
