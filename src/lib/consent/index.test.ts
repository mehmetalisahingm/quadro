// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CONSENT_CHANGE_EVENT,
  CONSENT_STORAGE_KEY,
  consentSnapshot,
  hasAdsConsent,
  hasAnalyticsConsent,
  parseConsent,
  readConsent,
  saveConsent,
} from "./index";

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("çerez onayı", () => {
  it("karar verilmeden analitik ve reklam kapalıdır", () => {
    expect(readConsent()).toBeNull();
    expect(hasAnalyticsConsent()).toBe(false);
    expect(hasAdsConsent()).toBe(false);
    expect(consentSnapshot()).toBe("undecided");
  });

  it("kabul ve ret kaydedilir ve olayla duyurulur", () => {
    const listener = vi.fn();
    window.addEventListener(CONSENT_CHANGE_EVENT, listener);
    saveConsent({ analytics: true, ads: false });
    expect(hasAnalyticsConsent()).toBe(true);
    expect(hasAdsConsent()).toBe(false);
    expect(consentSnapshot()).toBe("10");

    saveConsent({ analytics: false, ads: false });
    expect(hasAnalyticsConsent()).toBe(false);
    expect(consentSnapshot()).toBe("00");
    expect(listener).toHaveBeenCalledTimes(2);
    window.removeEventListener(CONSENT_CHANGE_EVENT, listener);
  });

  it("kayıt yalnız tercihi içerir, kimlik içermez", () => {
    saveConsent({ analytics: true, ads: false }, localStorage, new Date("2026-11-27T10:00:00Z"));
    expect(JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY) ?? "{}")).toEqual({
      version: 1, analytics: true, ads: false, decidedAt: "2026-11-27T10:00:00.000Z",
    });
  });

  it("bozuk, eski sürüm ya da 12 aydan eski kayıt yeniden sorulur", () => {
    const now = new Date("2026-11-27T00:00:00Z");
    expect(parseConsent("{bozuk", now)).toBeNull();
    expect(parseConsent(JSON.stringify({ version: 0, analytics: true, ads: true, decidedAt: now.toISOString() }), now)).toBeNull();
    expect(parseConsent(JSON.stringify({ version: 1, analytics: "evet", ads: false, decidedAt: now.toISOString() }), now)).toBeNull();
    expect(parseConsent(JSON.stringify({ version: 1, analytics: true, ads: false, decidedAt: "2025-11-01T00:00:00Z" }), now)).toBeNull();
    expect(parseConsent(JSON.stringify({ version: 1, analytics: true, ads: false, decidedAt: "2026-06-01T00:00:00Z" }), now)?.analytics).toBe(true);
  });

  it("depolama yazılamazsa seçim bu sayfada yine uygulanır", () => {
    const broken = { getItem: () => null, setItem: () => { throw new Error("quota"); } };
    saveConsent({ analytics: false, ads: false }, broken);
    expect(readConsent(broken)?.analytics).toBe(false);
  });
});
