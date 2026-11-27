"use client";

/**
 * PostHog EU yükleyicisi. Kurallar:
 * - Analitik onayı yoksa paket indirilmez, cihaza hiçbir şey yazılmaz, istek atılmaz.
 * - Paket yüklenemezse (adblock, ağ) her çağrı sessizce boşa düşer; oyun etkilenmez.
 * - Otomatik yakalama kapalıdır: tıklanan kart metni (yani kelimeler) asla gönderilmez.
 * - URL'lerden hash (ör. giriş token'ı) ve izinli olmayan sorgu parametreleri silinir.
 */

import { hasAnalyticsConsent } from "@/lib/consent";

import { captureLandingCampaign } from "./campaign";
import {
  sanitizeProductProperties,
  type ProductEventName,
  type ProductEventProperties,
} from "./product";

type Properties = Record<string, unknown>;

type CaptureResultLike = {
  properties?: Properties;
  $set?: Properties;
  $set_once?: Properties;
} & Record<string, unknown>;

/** Kullandığımız PostHog yüzeyinin küçük bir alt kümesi; testler sahte istemci verir. */
export type PostHogClient = {
  capture(name: string, properties?: Properties): unknown;
  register_for_session(properties: Properties): void;
  setPersonProperties(set?: Properties, setOnce?: Properties): void;
  opt_out_capturing(): void;
  opt_in_capturing(): void;
  reset(): void;
};

type PostHogModule = {
  init(token: string, config: Properties): PostHogClient | void;
};

export type PostHogLoader = () => Promise<PostHogModule>;

const DEFAULT_HOST = "https://eu.i.posthog.com";
const MAX_QUEUE = 50;
/** Sayfa adresinde kalabilecek tek parametreler; hepsi oyun gezintisi ya da kanal etiketi. */
const ALLOWED_QUERY = new Set(["utm_source", "utm_medium", "utm_campaign", "mode", "day", "difficulty", "level", "board"]);

let client: PostHogClient | null = null;
/** posthog-js tekil bir nesnedir; ret sonrası yeniden onayda tekrar init edilmez, açılır. */
let pausedClient: PostHogClient | null = null;
let loading: Promise<PostHogClient | null> | null = null;
let queue: { name: string; properties: Properties }[] = [];
let loader: PostHogLoader = () => import("posthog-js").then((module) => module.default as unknown as PostHogModule);

export function postHogConfig(): { key: string; host: string } | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (!key) return null;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim().replace(/\/$/, "") || DEFAULT_HOST;
  return { key, host };
}

/** Hash'i atar, yalnız izinli sorgu parametrelerini bırakır. Bozuk URL tamamen düşer. */
export function sanitizeUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (!ALLOWED_QUERY.has(key)) url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return undefined;
  }
}

function sanitizeUrlFields(bag: Properties | undefined): void {
  if (!bag) return;
  for (const [key, value] of Object.entries(bag)) {
    if (typeof value === "string" && /url|referrer|pathname|href/i.test(key) && /^https?:\/\//i.test(value)) {
      const clean = sanitizeUrl(value);
      if (clean) bag[key] = clean;
      else delete bag[key];
    }
  }
}

/** PostHog `before_send`: gönderimden hemen önce son temizlik. */
export function beforeSend<T extends CaptureResultLike | null>(event: T): T {
  if (!event) return event;
  sanitizeUrlFields(event.properties);
  sanitizeUrlFields(event.$set);
  sanitizeUrlFields(event.$set_once);
  return event;
}

function campaignProperties(): Properties {
  const campaign = captureLandingCampaign();
  return {
    ...(campaign.utmSource ? { utm_source: campaign.utmSource } : {}),
    ...(campaign.utmMedium ? { utm_medium: campaign.utmMedium } : {}),
    ...(campaign.utmCampaign ? { utm_campaign: campaign.utmCampaign } : {}),
  };
}

function initClient(module: PostHogModule, config: { key: string; host: string }): PostHogClient | null {
  let ready: PostHogClient | null = null;
  const result = module.init(config.key, {
    api_host: config.host,
    persistence: "localStorage",
    person_profiles: "always",
    capture_pageview: "history_change",
    capture_pageleave: false,
    autocapture: false,
    rageclick: false,
    capture_dead_clicks: false,
    capture_exceptions: false,
    capture_performance: false,
    enable_heatmaps: false,
    disable_session_recording: true,
    disable_surveys: true,
    disable_web_experiments: true,
    disable_external_dependency_loading: true,
    advanced_disable_flags: true,
    before_send: beforeSend,
    loaded: (instance: PostHogClient) => {
      ready = instance;
    },
  });
  const instance = ready ?? (result as PostHogClient | undefined) ?? null;
  if (!instance) return null;

  const campaign = campaignProperties();
  if (Object.keys(campaign).length > 0) {
    instance.register_for_session(campaign);
    // İlk dokunuş kanalı kişi profiline bir kez yazılır: geri dönüşler bu kanala göre kırılır.
    instance.setPersonProperties(undefined, Object.fromEntries(
      Object.entries(campaign).map(([key, value]) => [`initial_${key}`, value]),
    ));
  }
  return instance;
}

function flushQueue(instance: PostHogClient): void {
  const pending = queue;
  queue = [];
  for (const item of pending) {
    try { instance.capture(item.name, item.properties); } catch { /* yut */ }
  }
}

/** Onay varsa paketi bir kez yükler. Her hata `null` ile sonuçlanır, asla fırlatmaz. */
export function startPostHog(): Promise<PostHogClient | null> {
  if (client) return Promise.resolve(client);
  if (loading) return loading;
  const config = postHogConfig();
  if (!config || typeof window === "undefined" || !hasAnalyticsConsent()) return Promise.resolve(null);
  if (pausedClient) {
    try {
      pausedClient.opt_in_capturing();
      client = pausedClient;
      pausedClient = null;
      flushQueue(client);
      return Promise.resolve(client);
    } catch {
      return Promise.resolve(null);
    }
  }

  loading = loader()
    .then((module) => {
      // Paket inerken kullanıcı reddetmiş olabilir.
      if (!hasAnalyticsConsent()) return null;
      const instance = initClient(module, config);
      if (!instance) return null;
      client = instance;
      flushQueue(instance);
      return instance;
    })
    .catch(() => null)
    .finally(() => {
      loading = null;
    });
  return loading;
}

export function captureProductEvent<N extends ProductEventName>(
  name: N,
  properties: ProductEventProperties[N],
): void {
  try {
    if (!hasAnalyticsConsent() || !postHogConfig()) return;
    const clean = sanitizeProductProperties(name, properties);
    if (client) {
      client.capture(name, clean);
      return;
    }
    if (queue.length < MAX_QUEUE) queue.push({ name, properties: clean });
    void startPostHog();
  } catch {
    // Ölçüm hiçbir zaman oyunu bozmamalı.
  }
}

/** Ret ya da onayın geri alınması: yakalamayı durdur, PostHog'un yerel kaydını sil. */
export function stopPostHog(): void {
  queue = [];
  try {
    client?.opt_out_capturing();
    client?.reset();
  } catch {
    // Silme aşağıda yine yapılır.
  }
  if (client) pausedClient = client;
  client = null;
  if (typeof window === "undefined") return;
  try {
    const storage = window.localStorage;
    for (let index = storage.length - 1; index >= 0; index--) {
      const key = storage.key(index);
      if (key && (key.startsWith("ph_") || key.startsWith("__ph"))) storage.removeItem(key);
    }
  } catch {
    // Depolama erişilemiyorsa silinecek bir şey de yazılmamıştır.
  }
}

export function setPostHogLoaderForTests(next: PostHogLoader): void {
  loader = next;
  client = null;
  pausedClient = null;
  loading = null;
  queue = [];
}
