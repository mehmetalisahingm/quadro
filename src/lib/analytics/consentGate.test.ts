// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { standardPuzzle } from "@/features/game/fixtures";
import { saveConsent } from "@/lib/consent";

import { applyConsentToAnalytics } from "./AnalyticsRuntime";
import { captureLandingCampaign, resetLandingCampaignForTests } from "./campaign";
import {
  ANALYTICS_COHORT_KEY,
  ANALYTICS_LOCAL_KEYS,
  ANALYTICS_STORAGE_KEY,
  recordBrowserRetentionVisit,
  trackBrowserEvent,
} from "./index";
import { captureProductEvent, setPostHogLoaderForTests, startPostHog, type PostHogClient } from "./posthog";
import { puzzleContext } from "./product";
import { VISITOR_ID_STORAGE_KEY } from "./remote";

function fakePostHog() {
  const captured: { name: string; properties?: Record<string, unknown> }[] = [];
  const client: PostHogClient = {
    capture: (name, properties) => { captured.push({ name, properties }); },
    register_for_session: vi.fn(),
    setPersonProperties: vi.fn(),
    opt_out_capturing: vi.fn(),
    opt_in_capturing: vi.fn(),
    reset: vi.fn(),
  };
  const init = vi.fn((_key: string, config: Record<string, unknown>) => {
    (config.loaded as (instance: PostHogClient) => void)(client);
    return client;
  });
  const loader = vi.fn(async () => ({ init }));
  return { captured, client, init, loader };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  localStorage.clear();
  resetLandingCampaignForTests();
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("onay vermeden hiçbir ölçüm yok", () => {
  it("karar verilmemişken PostHog yüklenmez, cihaza ölçüm verisi yazılmaz", async () => {
    const posthog = fakePostHog();
    setPostHogLoaderForTests(posthog.loader);

    applyConsentToAnalytics();
    recordBrowserRetentionVisit();
    expect(trackBrowserEvent("share_attempt", { puzzleId: "q-001", revision: 1, method: "clipboard" })).toBeNull();
    captureProductEvent("puzzle_start", { ...puzzleContext(standardPuzzle), resumed: false });
    expect(await startPostHog()).toBeNull();
    await flush();

    expect(posthog.loader).not.toHaveBeenCalled();
    for (const key of ANALYTICS_LOCAL_KEYS) expect(localStorage.getItem(key)).toBeNull();
    expect(Object.keys(localStorage).filter((key) => key !== "quadro:consent:v1")).toEqual([]);
  });

  it("reddedince hiçbir şey gönderilmez ve önceden kalan ölçüm kayıtları silinir", async () => {
    const posthog = fakePostHog();
    setPostHogLoaderForTests(posthog.loader);
    // Bu sürümden önce onaysız yazılmış eski kayıtlar.
    localStorage.setItem(VISITOR_ID_STORAGE_KEY, "123e4567-e89b-42d3-a456-426614174000");
    localStorage.setItem(ANALYTICS_COHORT_KEY, "2026-11-01");
    localStorage.setItem(ANALYTICS_STORAGE_KEY, "[]");
    localStorage.setItem("ph_phc_test_key_posthog", "{}");

    saveConsent({ analytics: false, ads: false });
    applyConsentToAnalytics();
    captureProductEvent("hint_used", { mode: "easy", level: 1, hint_index: 1 });
    expect(trackBrowserEvent("share_attempt", { puzzleId: "q-001", revision: 1, method: "clipboard" })).toBeNull();
    await flush();

    expect(posthog.loader).not.toHaveBeenCalled();
    expect(posthog.captured).toEqual([]);
    for (const key of ANALYTICS_LOCAL_KEYS) expect(localStorage.getItem(key)).toBeNull();
    expect(localStorage.getItem("ph_phc_test_key_posthog")).toBeNull();
  });

  it("kabul edince PostHog yüklenir; geri alınca durur", async () => {
    const posthog = fakePostHog();
    setPostHogLoaderForTests(posthog.loader);

    saveConsent({ analytics: true, ads: false });
    captureProductEvent("puzzle_start", { mode: "daily", day: "2026-11-27", resumed: false });
    await startPostHog();
    expect(posthog.loader).toHaveBeenCalledTimes(1);
    expect(posthog.captured).toEqual([{ name: "puzzle_start", properties: { mode: "daily", day: "2026-11-27", resumed: false } }]);
    const config = posthog.init.mock.calls[0]?.[1] ?? {};
    expect(config).toMatchObject({ autocapture: false, persistence: "localStorage", disable_session_recording: true, api_host: "https://eu.i.posthog.com" });

    saveConsent({ analytics: false, ads: false });
    applyConsentToAnalytics();
    captureProductEvent("hint_used", { mode: "easy", level: 1, hint_index: 2 });
    expect(posthog.client.opt_out_capturing).toHaveBeenCalled();
    expect(posthog.captured).toHaveLength(1);
  });

  it("giriş sayfasındaki UTM onaydan sonra oturuma eklenir", async () => {
    window.history.replaceState({}, "", "/?utm_source=TikTok&utm_medium=social&utm_campaign=kasim_lansman&email=a@b.c");
    const posthog = fakePostHog();
    setPostHogLoaderForTests(posthog.loader);
    // AnalyticsRuntime ilk açılışta yapar; karar yokken yalnız bellekte tutulur.
    captureLandingCampaign();
    applyConsentToAnalytics();
    expect(Object.keys(localStorage)).toEqual([]);
    window.history.replaceState({}, "", "/play");

    saveConsent({ analytics: true, ads: false });
    await startPostHog();
    expect(posthog.client.register_for_session).toHaveBeenCalledWith({ utm_source: "tiktok", utm_medium: "social", utm_campaign: "kasim_lansman" });
    expect(posthog.client.setPersonProperties).toHaveBeenCalledWith(undefined, { initial_utm_source: "tiktok", initial_utm_medium: "social", initial_utm_campaign: "kasim_lansman" });
    window.history.replaceState({}, "", "/");
  });
});

describe("analitik çökse de oyun etkilenmez", () => {
  it("paket yüklenemezse (adblock) çağrılar fırlatmaz", async () => {
    setPostHogLoaderForTests(async () => { throw new Error("blocked by client"); });
    saveConsent({ analytics: true, ads: false });
    expect(() => captureProductEvent("puzzle_complete", { mode: "easy", level: 1, result: "won", mistakes: 0, duration_s: 30, hints_used: 0 })).not.toThrow();
    await expect(startPostHog()).resolves.toBeNull();
  });

  it("istemcinin capture çağrısı hata verse de fırlatmaz", async () => {
    const posthog = fakePostHog();
    posthog.client.capture = () => { throw new Error("boom"); };
    setPostHogLoaderForTests(posthog.loader);
    saveConsent({ analytics: true, ads: false });
    await startPostHog();
    expect(() => captureProductEvent("share_click", { mode: "daily", method: "copy" })).not.toThrow();
  });
});
