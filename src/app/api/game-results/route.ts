import { NextResponse } from "next/server";
import { trackIdentity } from "@/features/game/tracks";
import { journeyStep } from "@/features/game/journey";
import { pictureBoardNumber } from "@/features/game/pictures";
import { loadModePuzzle } from "@/lib/daily/modePuzzle";
import { loadJourneyPuzzle } from "@/lib/daily/journeyPuzzle";
import { loadPicturePuzzle } from "@/lib/daily/picturePuzzle";
import { loadPlayableDaily } from "@/lib/daily/playableDaily";
import { isPublicationDayKey, resolvePublicationDay } from "@/lib/daily/publicationDay";
import { verifyFinishedSnapshot } from "@/lib/results/verify";
import { verifySpecialFinishedSnapshot } from "@/lib/results/verifySpecial";
import type { SpecialMode } from "@/features/game/specialEnergy";
import { specialRecordId } from "@/features/game/specialRecordId";
import type { Puzzle } from "@/features/game/contracts";

export const runtime = "nodejs";
const MAX_BYTES = 16 * 1024;
const NO_CACHE = { "cache-control": "no-store" };

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status, headers: NO_CACHE });
}

async function loadMatchingPuzzle(id: string, day: string): Promise<Puzzle | null> {
  const track = trackIdentity(id);
  if (track) return loadModePuzzle(track.difficulty, track.level);
  const step = journeyStep(id);
  if (step !== null) return loadJourneyPuzzle(step);
  const board = pictureBoardNumber(id);
  if (board !== null) return loadPicturePuzzle(board);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day > resolvePublicationDay()) return null;
  const daily = await loadPlayableDaily({ dayKey: day });
  return daily.status === "ok" && daily.puzzle.id === id ? daily.puzzle : null;
}

async function loadSpecialPuzzle(id: string, day: string): Promise<Puzzle | null> {
  const match = /^special-(\d+)-(track-(?:easy|medium|balanced|hard)-\d{3})$/.exec(id);
  if (!match || !isPublicationDayKey(day) || day > resolvePublicationDay()) return null;
  const run = Number(match[1]);
  const track = trackIdentity(match[2]!);
  if (!Number.isSafeInteger(run) || run < 1 || !track) return null;
  const slot = (run - 1) % 48;
  const expected = ["medium", "hard", "easy", "ultra"][Math.floor(slot / 12)];
  if (track.difficulty !== expected || track.level !== slot % 12 + 1) return null;
  const puzzle = await loadModePuzzle(track.difficulty, track.level);
  return puzzle ? { ...puzzle, id, date: day } : null;
}

async function readSmallJson(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw Error("empty");
  const decoder = new TextDecoder();
  let size = 0;
  let data = "";
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > MAX_BYTES) throw Error("oversize");
      data += decoder.decode(part.value, { stream: true });
    }
    return JSON.parse(data + decoder.decode()) as unknown;
  } finally {
    void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

/** Client never writes directly to privileged game-result storage. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return fail(403, "forbidden_origin");
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) return fail(415, "unsupported_media_type");
  const bearer = request.headers.get("authorization") ?? "";
  if (!bearer.startsWith("Bearer ") || bearer.length > 8192 || bearer.length < 15) return fail(401, "unauthorized");
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BYTES) return fail(413, "payload_too_large");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !publicKey || !secretKey) return fail(503, "not_configured");

  let payload: unknown;
  try { payload = await readSmallJson(request); }
  catch { return fail(400, "invalid_payload"); }
  if (!payload || typeof payload !== "object" || Array.isArray(payload) || !("snapshot" in payload)) return fail(400, "invalid_payload");
  const snapshot: unknown = payload.snapshot;

  let userId: unknown;
  try {
    const auth = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: publicKey, authorization: bearer },
      cache: "no-store", signal: AbortSignal.timeout(8000),
    });
    if (!auth.ok) return fail(401, "unauthorized");
    const user = await auth.json() as { id?: unknown };
    userId = user.id;
  } catch { return fail(502, "auth_unavailable"); }
  if (typeof userId !== "string" || !/^[0-9a-f-]{36}$/i.test(userId)) return fail(401, "unauthorized");

  const raw = snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)
    ? snapshot as { puzzleId?: unknown; dayKey?: unknown } : null;
  if (!raw || typeof raw.puzzleId !== "string" || raw.puzzleId.length > 96 ||
      typeof raw.dayKey !== "string" || raw.dayKey.length !== 10) return fail(400, "invalid_snapshot");

  const special = "special" in payload && payload.special && typeof payload.special === "object" && !Array.isArray(payload.special)
    ? payload.special as { mode?: unknown; wagers?: unknown; bombId?: unknown; visitorId?: unknown } : null;
  const mode = special && (special.mode === "risk" || special.mode === "ladder" || special.mode === "bomb") ? special.mode as SpecialMode : null;
  if (special && (!mode || typeof special.visitorId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(special.visitorId))) return fail(400, "invalid_special_proof");
  const puzzle = mode ? await loadSpecialPuzzle(raw.puzzleId, raw.dayKey) : await loadMatchingPuzzle(raw.puzzleId, raw.dayKey);
  if (!puzzle || puzzle.id !== raw.puzzleId) return fail(400, "unknown_puzzle");
  const verified = mode && special ? verifySpecialFinishedSnapshot(puzzle, snapshot, { mode, wagers: special.wagers, bombId: special.bombId }) : verifyFinishedSnapshot(puzzle, snapshot);
  if (!verified) return fail(400, "invalid_run");

  try {
    const result = await fetch(`${url}/rest/v1/game_results?on_conflict=user_id,puzzle_id,puzzle_revision`, {
      method: "POST",
      headers: {
        apikey: secretKey, "content-type": "application/json",
        prefer: "resolution=ignore-duplicates,return=minimal",
      },
      cache: "no-store", signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        user_id: userId, puzzle_id: mode && special ? specialRecordId(mode, puzzle.date, puzzle.id, special.visitorId as string) : puzzle.id, puzzle_revision: puzzle.revision,
        result: verified.result, attempt_count: verified.attemptCount,
        mistakes_used: verified.mistakesUsed, active_seconds: verified.activeSeconds,
        played_at: new Date().toISOString(),
      }),
    });
    if (!result.ok) return fail(502, "result_store_unavailable");
    return new NextResponse(null, { status: 202, headers: NO_CACHE });
  } catch { return fail(502, "result_store_unavailable"); }
}
