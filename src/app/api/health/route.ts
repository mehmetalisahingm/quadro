import { loadPlayableDaily } from "@/lib/daily/playableDaily";
import { loadDailyPuzzle } from "@/lib/daily/dailyPuzzle";
import { resolvePublicationDay } from "@/lib/daily/publicationDay";

export const dynamic = "force-dynamic";
export async function GET() {
  const dayKey = resolvePublicationDay();
  const [today, scheduled] = await Promise.all([
    loadPlayableDaily({ dayKey }),
    Promise.all(Array.from({ length: 14 }, (_, offset) => {
      const day = new Date(Date.parse(`${dayKey}T00:00:00Z`) + offset * 86_400_000).toISOString().slice(0, 10);
      return loadDailyPuzzle({ dayKey: day });
    })),
  ]);
  const publishedDays = scheduled.filter(day => day.status === "ok").length;
  return Response.json({ dayKey, playable: today.status === "ok",
    selection: today.status === "ok" ? today.source.startsWith("reserve:") ? "reserve" : "scheduled" : "unavailable",
    publishedDays, windowDays: 14, editorialStockLow: publishedDays < 14,
  }, { status: today.status === "ok" ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
