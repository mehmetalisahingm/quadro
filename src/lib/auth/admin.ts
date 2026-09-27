"use client";

import { readStoredSession } from "./client";

function supabaseConfig(): { url: string; publishableKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && publishableKey ? { url, publishableKey } : null;
}

async function adminRpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const config = supabaseConfig();
  const session = readStoredSession();
  if (!config || !session) throw new Error("Önce hesabına giriş yapmalısın.");

  const response = await fetch(`${config.url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: config.publishableKey,
      authorization: `Bearer ${session.accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) throw new Error("Admin yetkisi doğrulanamadı.");
  return (await response.json()) as T;
}

export async function currentUserIsAdmin(): Promise<boolean> {
  try {
    return await adminRpc<boolean>("current_user_is_admin", {});
  } catch {
    return false;
  }
}

export async function claimAdmin(code: string): Promise<boolean> {
  const normalized = code.trim();
  if (!normalized) return false;
  return adminRpc<boolean>("claim_admin", { p_code: normalized });
}
