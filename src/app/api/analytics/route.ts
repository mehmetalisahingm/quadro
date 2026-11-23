import { NextResponse } from "next/server";
import { isThrottled } from "@/lib/security/requestThrottle";

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EVENT_ID_PATTERN = /^[A-Za-z0-9:_-]{1,128}$/;

const EVENT_NAMES = new Set([
  "home_view",
  "game_start",
  "game_progress",
  "first_attempt",
  "game_finish",
  "share_attempt",
  "retention_visit",
]);

const MAX_BODY_BYTES = 8 * 1024;

// Only coarse analytics fields are accepted: never store chosen words, answer keys, or raw user content.
const FIELDS: Record<string, readonly string[]> = {
  home_view: ["state", "dayKey", "puzzleAvailable"],
  game_start: ["puzzleId", "revision", "dayKey", "resumed", "mode"],
  game_progress: ["puzzleId", "revision", "dayKey", "solvedGroups", "attemptCount", "mistakesRemaining", "activeSeconds", "mode"],
  first_attempt: ["puzzleId", "revision", "verdict", "mistakesRemaining"],
  game_finish: ["puzzleId", "revision", "dayKey", "status", "attemptCount", "mistakesUsed", "activeSeconds", "mode", "score"],
  share_attempt: ["puzzleId", "revision", "method"],
  retention_visit: ["cohortDay", "activeDay", "dayOffset", "milestone"],
};

export const runtime = "nodejs";

type IncomingEvent = {
  id?: unknown;
  name?: unknown;
  at?: unknown;
  properties?: unknown;
};

type IncomingBody = {
  visitorId?: unknown;
  event?: IncomingEvent;
};

function resolvePuzzleId(properties: Record<string, unknown>): string | null {
  const puzzleId = properties.puzzleId;
  return typeof puzzleId === "string" && puzzleId.length <= 64 ? puzzleId : null;
}

function configuredSupabase(): { url: string; secretKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) return null;
  return { url, secretKey };
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "forbidden_origin" }, { status: 403 });
  }
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return NextResponse.json({ error: "unsupported_media_type" }, { status: 415 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  let body: IncomingBody;
  try {
    const reader = request.body?.getReader();
    if (!reader) return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    const decoder = new TextDecoder();
    let bytes = 0;
    let text = "";
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > MAX_BODY_BYTES) {
          void reader.cancel().catch(() => undefined);
          return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
        }
        text += decoder.decode(chunk.value, { stream: true });
      }
      const value: unknown = JSON.parse(text + decoder.decode());
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return NextResponse.json({ error: "invalid_json" }, { status: 400 });
      }
      body = value as IncomingBody;
    } finally { reader.releaseLock(); }
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { visitorId, event } = body;
  if (typeof visitorId !== "string" || !UUID_V4_PATTERN.test(visitorId)) {
    return NextResponse.json({ error: "invalid_visitor" }, { status: 400 });
  }

  if (!event || typeof event !== "object") {
    return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  }

  if (typeof event.id !== "string" || !EVENT_ID_PATTERN.test(event.id)) {
    return NextResponse.json({ error: "invalid_event_id" }, { status: 400 });
  }

  if (typeof event.name !== "string" || !EVENT_NAMES.has(event.name)) {
    return NextResponse.json({ error: "invalid_event_name" }, { status: 400 });
  }

  const occurredAt = typeof event.at === "string" ? new Date(event.at) : null;
  if (!occurredAt || !Number.isFinite(occurredAt.getTime())) {
    return NextResponse.json({ error: "invalid_event_time" }, { status: 400 });
  }

  const properties =
    event.properties && typeof event.properties === "object" && !Array.isArray(event.properties)
      ? (event.properties as Record<string, unknown>)
      : {};

  if (Object.keys(properties).some((key) => !FIELDS[event.name as string]?.includes(key))) {
    return NextResponse.json({ error: "unsupported_event_properties" }, { status: 400 });
  }
  if (properties.mode !== undefined && (typeof properties.mode !== "string" || !["risk", "ladder", "bomb"].includes(properties.mode))) {
    return NextResponse.json({ error: "invalid_mode" }, { status: 400 });
  }
  if (properties.mode !== undefined && event.name === "game_finish" && properties.status !== "won" && properties.status !== "lost") {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }
  if (properties.score !== undefined && (!Number.isInteger(properties.score) || Number(properties.score) < 0 || Number(properties.score) > 10000 || properties.mode === undefined)) {
    return NextResponse.json({ error: "invalid_score" }, { status: 400 });
  }
  if (event.name === "game_progress" && (
    !Number.isInteger(properties.solvedGroups) || Number(properties.solvedGroups) < 0 || Number(properties.solvedGroups) > 4 ||
    !Number.isInteger(properties.attemptCount) || Number(properties.attemptCount) < 1 || Number(properties.attemptCount) > 50 ||
    !Number.isInteger(properties.mistakesRemaining) || Number(properties.mistakesRemaining) < 0 || Number(properties.mistakesRemaining) > 4 ||
    !Number.isInteger(properties.activeSeconds) || Number(properties.activeSeconds) < 0 || Number(properties.activeSeconds) > 86400
  )) {
    return NextResponse.json({ error: "invalid_progress" }, { status: 400 });
  }
  const serializedProperties = JSON.stringify(properties);
  if (serializedProperties.length > 4_096) {
    return NextResponse.json({ error: "properties_too_large" }, { status: 413 });
  }

  // Best-effort per-instance throttle; global protection still requires a platform WAF.
  if (isThrottled(`analytics:${visitorId}`, 30, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  if (process.env.QUADRO_ANALYTICS_DISABLED === "1") {
    return new NextResponse(null, { status: 204 });
  }
  const supabase = configuredSupabase();
  if (!supabase) {
    // Local development and CI may intentionally run without a Supabase project.
    return new NextResponse(null, { status: 204 });
  }

  let response: Response;
  try {
    response = await fetch(`${supabase.url}/rest/v1/rpc/record_analytics_event`, {
    method: "POST",
    headers: {
      apikey: supabase.secretKey,
      "content-type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      p_client_event_id: event.id,
      p_visitor_id: visitorId,
      p_event_name: event.name,
      p_puzzle_id: resolvePuzzleId(properties),
      p_properties: properties,
    }),
    });
  } catch {
    return NextResponse.json({ error: "analytics_unavailable" }, { status: 502 });
  }

  if (!response.ok) {
    console.error("[analytics] Supabase RPC failed", {
      status: response.status,
      eventName: event.name,
    });
    return NextResponse.json({ error: "analytics_unavailable" }, { status: 502 });
  }

  return new NextResponse(null, { status: 202 });
}
