import { NextResponse } from "next/server";

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EVENT_ID_PATTERN = /^[A-Za-z0-9:_-]{1,128}$/;

const EVENT_NAMES = new Set([
  "home_view",
  "game_start",
  "first_attempt",
  "game_finish",
  "share_attempt",
  "retention_visit",
]);

const MAX_BODY_BYTES = 8 * 1024;

// Analytics is reachable by visitors without accounts. Persist only the documented,
// spoiler-free product fields; never forward arbitrary browser-controlled JSON to the DB.
type Guard = (value: unknown) => boolean;
const text64: Guard = value => typeof value === "string" && value.length > 0 && value.length <= 64;
const day: Guard = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value + "T00:00:00Z")) &&
  new Date(value + "T00:00:00Z").toISOString().slice(0, 10) === value;
const nonnegative: Guard = value => Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 1000000;
const revision: Guard = value => nonnegative(value) && (value as number) > 0;
const bool: Guard = value => typeof value === "boolean";
const oneOf = (...values: string[]): Guard => value => typeof value === "string" && values.includes(value);

const FIELD_GUARDS: Record<string, Record<string, Guard>> = {
  home_view: { state: oneOf("new", "in-progress", "completed"), dayKey: day, puzzleAvailable: bool },
  game_start: { puzzleId: text64, revision, dayKey: day, resumed: bool },
  first_attempt: { puzzleId: text64, revision, verdict: oneOf("correct", "one-away", "wrong"), mistakesRemaining: nonnegative },
  game_finish: { puzzleId: text64, revision, dayKey: day, status: oneOf("won", "lost"),
    attemptCount: nonnegative, mistakesUsed: nonnegative, activeSeconds: nonnegative },
  share_attempt: { puzzleId: text64, revision, method: oneOf("native-share", "clipboard", "share-fallback") },
  retention_visit: { cohortDay: day, activeDay: day, dayOffset: nonnegative,
    milestone: oneOf("D0", "D1", "D7", "other") }
};

function allowedProperties(name: string, properties: Record<string, unknown>): boolean {
  const guards = FIELD_GUARDS[name];
  if (!guards) return false;
  const keys = Object.keys(properties);
  return keys.length === Object.keys(guards).length &&
    keys.every(key => Object.prototype.hasOwnProperty.call(guards, key) && guards[key]!(properties[key]));
}

// Unlike Request.json(), this rejects chunked or misreported oversized payloads
// before buffering more than MAX_BODY_BYTES in memory.
async function readLimitedJson(request: Request): Promise<IncomingBody | "too_large" | null> {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0, text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        void reader.cancel().catch(() => undefined);
        return "too_large";
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    const parsed: unknown = JSON.parse(text);
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as IncomingBody : null;
  } catch {
    return null;
  }
}

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
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return NextResponse.json({ error: "unsupported_media_type" }, { status: 415 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  const body = await readLimitedJson(request);
  if (body === "too_large") return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  if (!body) return NextResponse.json({ error: "invalid_json" }, { status: 400 });

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

  if (!allowedProperties(event.name, properties)) {
    return NextResponse.json({ error: "invalid_event_properties" }, { status: 400 });
  }
  const serializedProperties = JSON.stringify(properties);
  if (serializedProperties.length > 4_096) {
    return NextResponse.json({ error: "properties_too_large" }, { status: 413 });
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
    console.error("[analytics] Supabase RPC transport unavailable");
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
