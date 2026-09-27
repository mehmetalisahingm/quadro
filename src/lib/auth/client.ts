"use client";

export const AUTH_SESSION_STORAGE_KEY = "quadro:auth:v1";
export const AUTH_SESSION_EVENT = "quadro:auth-session";

export type QuadroAuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

export type QuadroAuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: QuadroAuthUser;
};

type SupabaseAuthResponse = {
  access_token?: unknown;
  refresh_token?: unknown;
  expires_in?: unknown;
  expires_at?: unknown;
  user?: unknown;
};

function authConfig(): { url: string; publishableKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return null;
  return { url, publishableKey };
}

export function isSupabaseAuthConfigured(): boolean {
  return authConfig() !== null;
}

function authHeaders(publishableKey: string, accessToken?: string): HeadersInit {
  return {
    apikey: publishableKey,
    authorization: `Bearer ${accessToken ?? publishableKey}`,
    "content-type": "application/json",
  };
}

function parseUser(value: unknown): QuadroAuthUser | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.id !== "string") return null;

  return {
    id: raw.id,
    ...(typeof raw.email === "string" ? { email: raw.email } : {}),
    ...(raw.user_metadata && typeof raw.user_metadata === "object" && !Array.isArray(raw.user_metadata)
      ? { user_metadata: raw.user_metadata as Record<string, unknown> }
      : {}),
  };
}

function safeStoredSession(raw: string | null): QuadroAuthSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<QuadroAuthSession>;
    if (
      typeof parsed.accessToken !== "string" ||
      typeof parsed.refreshToken !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      !parsed.user ||
      typeof parsed.user.id !== "string"
    ) {
      return null;
    }
    return parsed as QuadroAuthSession;
  } catch {
    return null;
  }
}

function storeSession(session: QuadroAuthSession | null): void {
  if (typeof window === "undefined") return;
  try {
    if (session) {
      window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    }
    window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
  } catch {
    // Auth depolaması engelliyse oyun login olmadan çalışmaya devam eder.
  }
}

export function readStoredSession(): QuadroAuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    return safeStoredSession(window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function parseImplicitAuthFragment(fragment: string): {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
} | null {
  const params = new URLSearchParams(fragment.replace(/^#/, ""));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!accessToken || !refreshToken) return null;

  const explicitExpiresAt = Number(params.get("expires_at"));
  const expiresIn = Number(params.get("expires_in"));
  const expiresAt = Number.isFinite(explicitExpiresAt) && explicitExpiresAt > 0
    ? explicitExpiresAt
    : Math.floor(Date.now() / 1000) + (Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 3600);

  return { accessToken, refreshToken, expiresAt };
}

async function fetchUser(accessToken: string): Promise<QuadroAuthUser> {
  const config = authConfig();
  if (!config) throw new Error("Supabase auth yapılandırılmamış.");

  const response = await fetch(`${config.url}/auth/v1/user`, {
    method: "GET",
    headers: authHeaders(config.publishableKey, accessToken),
    cache: "no-store",
  });

  if (!response.ok) throw new Error("Kullanıcı oturumu doğrulanamadı.");
  const user = parseUser(await response.json());
  if (!user) throw new Error("Kullanıcı yanıtı geçersiz.");
  return user;
}

export async function completeImplicitSignIn(fragment: string): Promise<QuadroAuthSession> {
  const tokens = parseImplicitAuthFragment(fragment);
  if (!tokens) throw new Error("Giriş bağlantısında geçerli oturum bulunamadı.");

  const user = await fetchUser(tokens.accessToken);
  const session: QuadroAuthSession = { ...tokens, user };
  storeSession(session);
  return session;
}

export async function refreshStoredSession(
  session = readStoredSession(),
): Promise<QuadroAuthSession | null> {
  if (!session) return null;
  const config = authConfig();
  if (!config) return session;

  const now = Math.floor(Date.now() / 1000);
  if (session.expiresAt > now + 60) return session;

  const response = await fetch(`${config.url}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: authHeaders(config.publishableKey),
    cache: "no-store",
    body: JSON.stringify({ refresh_token: session.refreshToken }),
  });

  if (!response.ok) {
    storeSession(null);
    return null;
  }

  const data = (await response.json()) as SupabaseAuthResponse;
  if (typeof data.access_token !== "string" || typeof data.refresh_token !== "string") {
    storeSession(null);
    return null;
  }

  const user = parseUser(data.user) ?? (await fetchUser(data.access_token));
  const expiresIn = typeof data.expires_in === "number" ? data.expires_in : Number(data.expires_in);
  const explicitExpiresAt = typeof data.expires_at === "number" ? data.expires_at : Number(data.expires_at);
  const expiresAt = Number.isFinite(explicitExpiresAt) && explicitExpiresAt > 0
    ? explicitExpiresAt
    : Math.floor(Date.now() / 1000) + (Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 3600);

  const next: QuadroAuthSession = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
    user,
  };
  storeSession(next);
  return next;
}

function callbackUrl(): string {
  if (typeof window === "undefined") return "/auth/callback";
  return `${window.location.origin}/auth/callback`;
}

export function startGoogleSignIn(): void {
  const config = authConfig();
  if (!config) throw new Error("Supabase auth henüz yapılandırılmamış.");
  if (typeof window === "undefined") return;

  const authorize = new URL(`${config.url}/auth/v1/authorize`);
  authorize.searchParams.set("provider", "google");
  authorize.searchParams.set("redirect_to", callbackUrl());
  window.location.assign(authorize.toString());
}

export async function sendMagicLink(email: string): Promise<void> {
  const config = authConfig();
  if (!config) throw new Error("Supabase auth henüz yapılandırılmamış.");

  const endpoint = new URL(`${config.url}/auth/v1/otp`);
  endpoint.searchParams.set("redirect_to", callbackUrl());

  const response = await fetch(endpoint, {
    method: "POST",
    headers: authHeaders(config.publishableKey),
    cache: "no-store",
    body: JSON.stringify({
      email,
      create_user: true,
      data: {},
      gotrue_meta_security: {},
      code_challenge: null,
      code_challenge_method: null,
    }),
  });

  if (!response.ok) {
    let message = "Giriş bağlantısı gönderilemedi.";
    try {
      const payload = (await response.json()) as { msg?: unknown; message?: unknown };
      if (typeof payload.message === "string") message = payload.message;
      else if (typeof payload.msg === "string") message = payload.msg;
    } catch {
      // Varsayılan kullanıcı mesajını koru.
    }
    throw new Error(message);
  }
}

export async function signOut(): Promise<void> {
  const session = readStoredSession();
  const config = authConfig();

  if (session && config) {
    try {
      await fetch(`${config.url}/auth/v1/logout`, {
        method: "POST",
        headers: authHeaders(config.publishableKey, session.accessToken),
        cache: "no-store",
      });
    } catch {
      // Uzak çıkış başarısız olsa bile yerel oturum silinir.
    }
  }

  storeSession(null);
}

export function displayNameForUser(user: QuadroAuthUser): string {
  const metadata = user.user_metadata ?? {};
  for (const key of ["full_name", "name", "preferred_username"]) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  if (user.email) return user.email.split("@")[0] || "Hesabım";
  return "Hesabım";
}
