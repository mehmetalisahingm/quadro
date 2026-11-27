"use client";

import { useEffect } from "react";

import { readConsent, subscribeConsent } from "@/lib/consent";
import { installGlobalMonitoring } from "@/lib/monitoring";

import { captureLandingCampaign } from "./campaign";
import { clearAnalyticsStorage, recordBrowserRetentionVisit } from "./index";
import { startPostHog, stopPostHog } from "./posthog";

/**
 * Onay durumuna göre ölçümü açar ya da kapatır.
 * - Karar yok: hiçbir şey yüklenmez ve yazılmaz; UTM yalnız bellekte bekler.
 * - Kabul: geri dönüş ziyareti kaydedilir, PostHog yüklenir.
 * - Ret: yerel ölçüm kayıtları ve PostHog'un yerel verisi silinir.
 */
export function applyConsentToAnalytics(): void {
  const consent = readConsent();
  if (consent?.analytics) {
    recordBrowserRetentionVisit();
    void startPostHog();
  } else if (consent) {
    stopPostHog();
    clearAnalyticsStorage();
  }
}

export function AnalyticsRuntime() {
  useEffect(() => {
    // Giriş sayfasının kampanya etiketleri, kullanıcı gezinmeden önce yakalanır.
    captureLandingCampaign();
    applyConsentToAnalytics();
    const unsubscribe = subscribeConsent(applyConsentToAnalytics);
    const uninstallMonitoring = installGlobalMonitoring();
    return () => {
      unsubscribe();
      uninstallMonitoring();
    };
  }, []);

  return null;
}
