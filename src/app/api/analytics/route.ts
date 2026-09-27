import { NextResponse } from "next/server";

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EVENT_NAMES = new Set([
  "home_view",
  "game_start",
  "first_attempt",
  "game_finish",
  "share_attempt",
  "retention_visit",
]);

const MAX_BODY_BYTES = 8 * 1024;

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
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  let body: IncomingBody;
  try {
    body = (await request.json()) as IncomingBody;
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

  const serializedProperties = JSON.stringify(properties);
  if (serializedProperties.length > 4_096) {
    return NextResponse.json({ error: "properties_too_large" }, { status: 413 });
  }

  const supabase = configuredSupabase();
  if (!supabase) {
    // Local development and CI may intentionally run without a Supabase project.
    return new NextResponse(null, { status: 204 });
  }

  const response = await fetch(`${supabase.url}/rest/v1/rpc/record_analytics_event`, {
    method: "POST",
    headers: {
      apikey: supabase.secretKey,
      "content-type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      p_visitor_id: visitorId,
      p_event_name: event.name,
      p_puzzle_id: resolvePuzzleId(properties),
      p_properties: properties,
      p_occurred_at: occurredAt.toISOString(),
    }),
  });

  if (!response.ok) {
    console.error("[analytics] Supabase RPC failed", {
      status: response.status,
      eventName: event.name,
    });
    return NextResponse.json({ error: "analytics_unavailable" }, { status: 502 });
  }

  return new NextResponse(null, { status: 202 });
}
