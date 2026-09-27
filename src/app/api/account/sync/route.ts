import { NextResponse } from "next/server";

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RESULTS = 90;
const MAX_BODY_BYTES = 64 * 1024;

export const runtime = "nodejs";

type SyncResult = {
  dayKey?: unknown;
  puzzleId?: unknown;
  puzzleRevision?: unknown;
  outcome?: unknown;
  mistakes?: unknown;
  streakEligible?: unknown;
};

type SyncBody = {
  visitorId?: unknown;
  results?: unknown;
};

type AuthUserPayload = {
  id?: unknown;
};

function configuredSupabase(): {
  url: string;
  publishableKey: string;
  secretKey: string;
} | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !publishableKey || !secretKey) return null;
  return { url, publishableKey, secretKey };
}

function readBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  return token || null;
}

function validResult(value: unknown): value is Required<SyncResult> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const result = value as SyncResult;
  return (
    typeof result.dayKey === "string" &&
    DAY_KEY_PATTERN.test(result.dayKey) &&
    typeof result.puzzleId === "string" &&
    result.puzzleId.length > 0 &&
    result.puzzleId.length <= 64 &&
    typeof result.puzzleRevision === "number" &&
    Number.isInteger(result.puzzleRevision) &&
    result.puzzleRevision > 0 &&
    (result.outcome === "won" || result.outcome === "lost") &&
    typeof result.mistakes === "number" &&
    Number.isInteger(result.mistakes) &&
    result.mistakes >= 0 &&
    result.mistakes <= 4 &&
    typeof result.streakEligible === "boolean"
  );
}

async function adminRequest(
  config: NonNullable<ReturnType<typeof configuredSupabase>>,
  path: string,
  init: RequestInit,
): Promise<Response> {
  return fetch(`${config.url}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: config.secretKey,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  const accessToken = readBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const config = configuredSupabase();
  if (!config) {
    return NextResponse.json({ error: "account_sync_unconfigured" }, { status: 503 });
  }

  let body: SyncBody;
  try {
    body = (await request.json()) as SyncBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (typeof body.visitorId !== "string" || !UUID_V4_PATTERN.test(body.visitorId)) {
    return NextResponse.json({ error: "invalid_visitor" }, { status: 400 });
  }

  if (!Array.isArray(body.results) || body.results.length > MAX_RESULTS) {
    return NextResponse.json({ error: "invalid_results" }, { status: 400 });
  }

  const results = body.results.filter(validResult);
  if (results.length !== body.results.length) {
    return NextResponse.json({ error: "invalid_result_entry" }, { status: 400 });
  }

  const userResponse = await fetch(`${config.url}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: config.publishableKey,
      authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!userResponse.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const user = (await userResponse.json()) as AuthUserPayload;
  if (typeof user.id !== "string" || !user.id) {
    return NextResponse.json({ error: "invalid_user" }, { status: 401 });
  }

  const now = new Date().toISOString();
  const visitorResponse = await adminRequest(
    config,
    "/rest/v1/visitors?on_conflict=visitor_id",
    {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        visitor_id: body.visitorId,
        linked_user_id: user.id,
        first_seen_at: now,
        last_seen_at: now,
      }),
    },
  );

  if (!visitorResponse.ok) {
    console.error("[account-sync] visitor upsert failed", { status: visitorResponse.status });
    return NextResponse.json({ error: "sync_unavailable" }, { status: 502 });
  }

  const analyticsResponse = await adminRequest(
    config,
    `/rest/v1/analytics_events?visitor_id=eq.${encodeURIComponent(body.visitorId)}&user_id=is.null`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ user_id: user.id }),
    },
  );

  if (!analyticsResponse.ok) {
    console.error("[account-sync] analytics link failed", { status: analyticsResponse.status });
    return NextResponse.json({ error: "sync_unavailable" }, { status: 502 });
  }

  if (results.length > 0) {
    const rows = results.map((result) => ({
      user_id: user.id,
      visitor_id: body.visitorId,
      day_key: result.dayKey,
      puzzle_id: result.puzzleId,
      puzzle_revision: result.puzzleRevision,
      result: result.outcome,
      mistakes_used: result.mistakes,
      streak_eligible: result.streakEligible,
      attempt_count: 0,
      active_seconds: 0,
      played_at: `${result.dayKey}T12:00:00.000Z`,
    }));

    const gameResponse = await adminRequest(
      config,
      "/rest/v1/game_results?on_conflict=user_id,day_key",
      {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(rows),
      },
    );

    if (!gameResponse.ok) {
      console.error("[account-sync] game result upsert failed", { status: gameResponse.status });
      return NextResponse.json({ error: "sync_unavailable" }, { status: 502 });
    }
  }

  return NextResponse.json({ ok: true, syncedResults: results.length });
}
