"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import {
  isSupabaseAuthConfigured,
  sendMagicLink,
} from "@/lib/auth/client";

import styles from "./login.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const configured = isSupabaseAuthConfigured();

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;

    setSending(true);
    setMessage(null);
    setError(null);

    try {
      await sendMagicLink(email.trim());
      setMessage("Giriş bağlantısını e-postana gönderdik. Bağlantı tek kullanımlıktır.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Giriş bağlantısı gönderilemedi.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="login-title">
        <p className={styles.eyebrow}>QUADRO HESABI</p>
        <h1 id="login-title" className={styles.title}>
          Oynamak için hesap şart değil.
        </h1>
        <p className={styles.description}>
          İstersen e-posta ile giriş yapıp sonuçlarını ve serini hesabına bağlayabilirsin. Hesap
          açmadan da bulmacaları aynen oynamaya devam edebilirsin.
        </p>

        <form className={styles.form} onSubmit={submitEmail}>
          <label className={styles.label} htmlFor="login-email">
            E-posta
          </label>
          <input
            className={styles.input}
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="sen@example.com"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button className={styles.emailButton} type="submit" disabled={!configured || sending}>
            {sending ? "Gönderiliyor…" : "E-posta ile giriş bağlantısı gönder"}
          </button>
        </form>

        <p className={styles.note}>Google ile giriş, OAuth sağlayıcısı bağlandıktan sonra açılacak.</p>

        {!configured ? (
          <p className={styles.note}>
            Hesap sistemi henüz bu ortamda Supabase anahtarlarıyla yapılandırılmadı. Oyun login olmadan
            çalışmaya devam eder.
          </p>
        ) : null}

        {message ? <p className={styles.message}>{message}</p> : null}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}

        <Link className={styles.back} href="/">
          ← Oyuna dön
        </Link>
      </section>
    </main>
  );
}
