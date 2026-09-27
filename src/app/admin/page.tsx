"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { claimAdmin, currentUserIsAdmin } from "@/lib/auth/admin";
import { readStoredSession } from "@/lib/auth/client";

export default function AdminPage() {
  const [code, setCode] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void currentUserIsAdmin().then((admin) => {
      setIsAdmin(admin);
      setChecking(false);
    });
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!readStoredSession()) {
      setError("Önce normal giriş ekranından hesabına giriş yap.");
      return;
    }

    try {
      const claimed = await claimAdmin(code);
      if (!claimed) {
        setError("Admin kodu geçersiz veya daha önce kullanılmış.");
        return;
      }
      setIsAdmin(true);
      setCode("");
      setMessage("Admin modu etkin. Bulmacalarda hata hakkın artık sınırsız.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Admin yetkisi etkinleştirilemedi.");
    }
  }

  return (
    <main style={{ minHeight: "100svh", display: "grid", placeItems: "center", padding: "2rem" }}>
      <section style={{ width: "min(32rem, 100%)", display: "grid", gap: "1rem" }}>
        <p style={{ fontWeight: 800, letterSpacing: "0.14em", fontSize: "0.75rem" }}>QUADRO ADMIN</p>
        <h1 style={{ margin: 0 }}>Admin modu</h1>

        {checking ? <p>Yetki kontrol ediliyor…</p> : null}
        {!checking && isAdmin ? (
          <>
            <p><strong>Admin aktif.</strong> Hata hakkın sınırsız.</p>
            <Link href="/play">Bulmacaya dön →</Link>
          </>
        ) : null}

        {!checking && !isAdmin ? (
          <form onSubmit={submit} style={{ display: "grid", gap: "0.75rem" }}>
            <label htmlFor="admin-code">Tek kullanımlık admin kodu</label>
            <input
              id="admin-code"
              type="password"
              autoComplete="off"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
              style={{ minHeight: 44, padding: "0.75rem" }}
            />
            <button type="submit" style={{ minHeight: 44, fontWeight: 800 }}>
              Admin modunu etkinleştir
            </button>
          </form>
        ) : null}

        {message ? <p role="status">{message}</p> : null}
        {error ? <p role="alert" style={{ color: "#b91c1c" }}>{error}</p> : null}
        <Link href="/">← Ana sayfa</Link>
      </section>
    </main>
  );
}
