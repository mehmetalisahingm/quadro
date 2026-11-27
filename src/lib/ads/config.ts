export const ADSENSE_CLIENT = "ca-pub-3615988430927806";

export function resolveAdSlot(config: { environment?: string; enabled?: string; cmpReady?: string; slot?: string }): string | null {
  if (config.environment !== "production" || config.enabled !== "true" || config.cmpReady !== "true") return null;
  return config.slot && /^\d{10}$/.test(config.slot) ? config.slot : null;
}
