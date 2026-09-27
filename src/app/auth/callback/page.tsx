"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { completeImplicitSignIn } from "@/lib/auth/client";

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const authError = params.get("error_description") ?? params.get("error");
    if (authError) {
      window.history.replaceState({}, "", window.location.pathname);
      void Promise.resolve().then(() => setError(authError));
      return;
    }

    void completeImplicitSignIn(window.location.hash)
      .then(() => {
        window.history.replaceState({}, "", window.location.pathname);
        window.location.replace("/");
      })
      .catch((caught) => {
        window.history.replaceState({}, "", window.location.pathname);
        setError(caught instanceof Error ? caught.message : "Giriş tamamlanamadı.");
      });
  }, []);

  return (
    <main
      style={{
        minHeight: "100svh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
        background: "#f4f1e8",
        color: "#18181b",
        textAlign: "center",
      }}
    >
      <section>
        <p style={{ fontWeight: 800, letterSpacing: "0.14em", fontSize: "0.75rem" }}>QUADRO</p>
        <h1 style={{ margin: "0.5rem 0", fontSize: "clamp(2rem, 6vw, 3.5rem)" }}>
          {error ? "Giriş tamamlanamadı" : "Giriş tamamlanıyor…"}
        </h1>
        {error ? (
          <>
            <p role="alert" style={{ maxWidth: "34rem", lineHeight: 1.6, color: "#b91c1c" }}>
              {error}
            </p>
            <Link href="/login" style={{ color: "inherit", fontWeight: 800 }}>
              Giriş ekranına dön
            </Link>
          </>
        ) : (
          <p style={{ color: "#71717a" }}>Oturum doğrulanıyor.</p>
        )}
      </section>
    </main>
  );
}
