import { NextResponse } from "next/server";
import { loadModePuzzle } from "@/lib/daily/modePuzzle";
import { isPublicationDayKey, resolvePublicationDay } from "@/lib/daily/publicationDay";
import type { GameDifficulty } from "@/features/game/difficulty";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const slot = Number(params.get("slot"));
  const run = Number(params.get("run"));
  const day = params.get("day");
  if (!params.has("slot") || !params.has("run") || !Number.isInteger(slot) || slot < 0 || slot >= 48 || !Number.isSafeInteger(run) || run < 1 || !day || !isPublicationDayKey(day) || day > resolvePublicationDay()) return NextResponse.json({ error: "Geçersiz oyun" }, { status: 400 });
  const modes: GameDifficulty[] = ["medium", "hard", "easy", "ultra"];
  const puzzle = await loadModePuzzle(modes[Math.floor(slot / 12)]!, slot % 12 + 1);
  if (!puzzle) return NextResponse.json({ error: "Tahta bulunamadı" }, { status: 404 });
  return NextResponse.json({ ...puzzle, id: `special-${run}-${puzzle.id}`, date: day }, { headers: { "Cache-Control": "no-store" } });
}
