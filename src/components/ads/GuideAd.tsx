import { resolveAdSlot } from "@/lib/ads/config";
import { DisplayAd } from "./DisplayAd";

export function GuideAd() {
  const slot = resolveAdSlot({
    environment: process.env.VERCEL_ENV,
    enabled: process.env.QUADRO_ADSENSE_ENABLED,
    cmpReady: process.env.QUADRO_ADSENSE_CMP_READY,
    slot: process.env.QUADRO_ADSENSE_GUIDE_SLOT,
  });
  return slot ? <DisplayAd slot={slot} /> : null;
}
