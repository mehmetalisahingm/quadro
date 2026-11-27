/**
 * Giriş sayfasındaki kampanya etiketleri (utm_source/medium/campaign).
 *
 * Onay verilmeden önce yalnız sayfanın belleğinde tutulur, cihaza yazılmaz. Kullanıcı
 * aynı oturumda başka sayfaya geçtikten sonra onay verse bile ilk giriş kanalı kaybolmaz.
 */

export type CampaignAttribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

/** Yalnız kısa, anonim kanal etiketleri: serbest metin kişisel veri taşıyabilir. */
const SAFE_LABEL = /^[a-z0-9_-]{1,40}$/i;

let landingCampaign: CampaignAttribution | null = null;

export function parseCampaign(search: string): CampaignAttribution {
  const params = new URLSearchParams(search);
  const safe = (key: string): string | undefined => {
    const value = params.get(key)?.trim().toLowerCase();
    return value && SAFE_LABEL.test(value) ? value : undefined;
  };
  const utmSource = safe("utm_source");
  const utmMedium = safe("utm_medium");
  const utmCampaign = safe("utm_campaign");
  return {
    ...(utmSource ? { utmSource } : {}),
    ...(utmMedium ? { utmMedium } : {}),
    ...(utmCampaign ? { utmCampaign } : {}),
  };
}

/** İlk çağrıda giriş URL'sini okur; sonraki çağrılar aynı değeri döndürür. */
export function captureLandingCampaign(): CampaignAttribution {
  if (landingCampaign) return landingCampaign;
  if (typeof window === "undefined") return {};
  try {
    landingCampaign = parseCampaign(window.location.search);
  } catch {
    landingCampaign = {};
  }
  return landingCampaign;
}

export function resetLandingCampaignForTests(): void {
  landingCampaign = null;
}
