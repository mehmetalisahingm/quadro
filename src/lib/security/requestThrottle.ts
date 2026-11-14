// In-memory best-effort throttle. Vercel instances do not share this Map;
// production-wide enforcement requires a managed distributed rate limiter / WAF.
type Counter = { count: number; until: number };
const counters = new Map<string, Counter>();
export function isThrottled(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const existing = counters.get(key);
  if (!existing || now >= existing.until) {
    if (counters.size >= 5000) {
      for (const [id, item] of counters) {
        if (now >= item.until) counters.delete(id);
      }
      if (counters.size >= 5000) counters.clear();
    }
    counters.set(key, { count: 1, until: now + windowMs });
    return false;
  }
  existing.count++;
  return existing.count > limit;
}
