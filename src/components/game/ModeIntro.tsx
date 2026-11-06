"use client";

import { useEffect, useState } from "react";

import styles from "./RiskGame.module.css";

/** Modun kısa, görselli kural anlatımı. İlk girişte açık gelir; kapatılınca bu tarayıcıda kapalı kalır. */
export function ModeIntro({ mode, title, rules }: { mode: string; title: string; rules: readonly (readonly [string, string])[] }) {
  const key = `quadro:mode-intro:v1:${mode}`;
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { setOpen(localStorage.getItem(key) === null); } catch { setOpen(true); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [key]);

  return (
    <details
      className={styles.intro}
      open={open}
      onToggle={(event) => {
        const isOpen = event.currentTarget.open;
        setOpen(isOpen);
        if (!isOpen) {
          try { localStorage.setItem(key, "1"); } catch { /* Tercih kaydı isteğe bağlıdır. */ }
        }
      }}
    >
      <summary>{title}</summary>
      <ul>
        {rules.map(([icon, text]) => (
          <li key={text}><span aria-hidden="true">{icon}</span>{text}</li>
        ))}
      </ul>
    </details>
  );
}
