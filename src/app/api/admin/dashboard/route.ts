import { NextResponse } from "next/server";

export const runtime = "nodejs";

function config(): { url: string; publishableKey: string; secretKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  return url && publishableKey && secretKey ? { url, publishableKey, secretKey } : null;
}

function bearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return null;
  const token = authorization.slice(7).trim();
  return token || null;
}

export async function GET(request: Request) {
  const supabase = config();
  if (!supabase) {
    return NextResponse.json({ error: "admin_dashboard_unavailable" }, { status: 503 });
  }

  const token = bearerToken(request);
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const adminCheck = await fetch(`${supabase.url}/rest/v1/rpc/current_user_is_admin`, {
    method: "POST",
    headers: {
      apikey: supabase.publishableKey,
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: "{}",
    cache: "no-store",
  });

  if (!adminCheck.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const isAdmin = (await adminCheck.json()) === true;
  if (!isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const dashboard = await fetch(`${supabase.url}/rest/v1/rpc/admin_dashboard_snapshot`, {
    method: "POST",
    headers: {
      apikey: supabase.secretKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({ p_limit: 50 }),
    cache: "no-store",
  });

  if (!dashboard.ok) {
    console.error("[admin-dashboard] Supabase RPC failed", { status: dashboard.status });
    return NextResponse.json({ error: "dashboard_unavailable" }, { status: 502 });
  }

  return NextResponse.json(await dashboard.json(), {
    headers: { "cache-control": "no-store" },
  });
}
