"use client";

import { useEffect, useState } from "react";
import styles from "./FootballReaction.module.css";

export type FootballVariant = "flag" | "whistle";

export function FootballArt({ variant = "flag", lost = false }: { variant?: FootballVariant; lost?: boolean }) {
  return <span className={`${styles.art} ${variant === "whistle" ? styles.whistle : styles.flag} ${lost ? styles.lost : ""}`} aria-hidden="true">
    <span className={styles.pitch} /><span className={styles.line} />
    <span className={styles.referee}><i /><b /><span /><em><i /></em></span>
    <span className={styles.whistleIcon}><i /></span><span className={styles.soundRings}><i /><i /></span>
    <span className={styles.label}>{lost ? "SON DÜDÜK" : variant === "flag" ? "OFSAYT" : "TEKRAR DENE"}</span>
  </span>;
}

/** Presentation only: no focus capture, input lock, sound override or scoring changes. */
export function FootballReaction({ variant, lost = false, onComplete }: { variant: FootballVariant; lost?: boolean; onComplete?: () => void }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => { setVisible(false); onComplete?.(); }, 1100);
    return () => window.clearTimeout(timer);
  }, [onComplete]);
  return visible ? <span className={styles.reaction} data-football-reaction={variant}><FootballArt variant={variant} lost={lost} /></span> : null;
}
