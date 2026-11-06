import { NextResponse } from "next/server";

export const runtime = "nodejs";
const headers = { "cache-control": "no-store" };
const PAGE_SIZE = 25;

export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !publicKey || !secretKey) return NextResponse.json({ error: "users_unavailable" }, { status: 503, headers });
  const auth = request.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ") || !auth.slice(7).trim()) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers });
  const rawPage = new URL(request.url).searchParams.get("page") ?? "1";
  if (!/^[1-9]\d{0,5}$/.test(rawPage)) return NextResponse.json({ error: "invalid_page" }, { status: 400, headers });
  const page = Number(rawPage);
  try {
    const admin = await fetch(`${url}/rest/v1/rpc/current_user_is_admin`, {
      method: "POST", headers: { apikey: publicKey, authorization: auth, "content-type": "application/json" },
      body: "{}", cache: "no-store", signal: AbortSignal.timeout(8000),
    });
    if (!admin.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers });
    if (await admin.json() !== true) return NextResponse.json({ error: "forbidden" }, { status: 403, headers });

    const response = await fetch(`${url}/auth/v1/admin/users?page=${page}&per_page=${PAGE_SIZE}`, {
      headers: { apikey: secretKey }, cache: "no-store", signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return NextResponse.json({ error: "users_unavailable" }, { status: 502, headers });
    const data: unknown = await response.json();
    if (!data || typeof data !== "object" || !("users" in data) || !Array.isArray(data.users)) throw new Error("Invalid user list");
    const users = data.users.filter((user: unknown): user is Record<string, unknown> => !!user && typeof user === "object" && !Array.isArray(user) && (user as Record<string, unknown>).is_anonymous !== true).map(user => {
      const meta = user.user_metadata && typeof user.user_metadata === "object" && !Array.isArray(user.user_metadata) ? user.user_metadata as Record<string, unknown> : {};
      return { id: typeof user.id === "string" ? user.id : "", email: typeof user.email === "string" ? user.email : null,
        displayName: typeof meta.display_name === "string" ? meta.display_name : typeof meta.full_name === "string" ? meta.full_name : null,
        createdAt: typeof user.created_at === "string" ? user.created_at : null,
        lastSignInAt: typeof user.last_sign_in_at === "string" ? user.last_sign_in_at : null,
        emailConfirmed: typeof user.email_confirmed_at === "string" };
    }).filter(user => user.id);
    const totalHeader = response.headers.get("x-total-count");
    const total = totalHeader && /^\d+$/.test(totalHeader) ? Number(totalHeader) : null;
    return NextResponse.json({ users, page, hasNext: total !== null ? page * PAGE_SIZE < total : data.users.length === PAGE_SIZE }, { headers });
  } catch {
    return NextResponse.json({ error: "users_unavailable" }, { status: 502, headers });
  }
}
