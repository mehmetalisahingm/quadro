"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  AUTH_SESSION_EVENT,
  displayNameForUser,
  readStoredSession,
  refreshStoredSession,
  signOut,
  type QuadroAuthSession,
} from "@/lib/auth/client";

import styles from "./AccountControl.module.css";

export function AccountControl() {
  const [session, setSession] = useState<QuadroAuthSession | null>(null);

  useEffect(() => {
    let active = true;

    const sync = () => {
      void refreshStoredSession(readStoredSession()).then((next) => {
        if (active) setSession(next);
      });
    };

    sync();
    window.addEventListener(AUTH_SESSION_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      active = false;
      window.removeEventListener(AUTH_SESSION_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!session) {
    return (
      <div className={styles.accountControl} aria-label="Hesap">
        <Link className={styles.loginLink} href="/login">
          Giriş Yap
        </Link>
      </div>
    );
  }

  const label = displayNameForUser(session.user);

  return (
    <div className={styles.accountControl} aria-label="Hesap">
      <Link className={styles.accountPill} href="/stats" title={label}>
        {label}
      </Link>
      <button
        className={styles.signOutButton}
        type="button"
        onClick={() => {
          void signOut().then(() => setSession(null));
        }}
      >
        Çıkış
      </button>
    </div>
  );
}
