"use client";

import { useCallback, useEffect, useId, useRef, type CSSProperties } from "react";

import styles from "./BoardPrelude.module.css";

type BoardPreludeProps = {
  onComplete: () => void;
  onReveal?: () => void;
  poster?: boolean;
};

const PRELUDE_MS = 3400;

const TILES = Array.from({ length: 16 }, (_, index) => ({
  index,
  column: index % 4,
  row: Math.floor(index / 4),
}));

/** A single optical sculpture becomes the four-by-four playing surface. */
export function BoardPrelude({ onComplete, onReveal, poster = false }: BoardPreludeProps) {
  const id = useId().replace(/:/g, "");
  const completeRef = useRef(onComplete);
  const completedRef = useRef(false);
  const revealRef = useRef(onReveal);
  const skipRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { revealRef.current = onReveal; }, [onReveal]);

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    revealRef.current?.();
    completeRef.current();
  }, []);

  useEffect(() => {
    if (poster) return;
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    skipRef.current?.focus({ preventScroll: true });
    const revealTimer = window.setTimeout(() => { if (!completedRef.current) revealRef.current?.(); }, PRELUDE_MS - 400);
    // animationend owns the handoff; the timer also works if CSS never loads.
    const timer = window.setTimeout(finish, media?.matches ? 0 : PRELUDE_MS + 150);
    const handlePreference = (event: MediaQueryListEvent) => {
      if (event.matches) finish();
    };
    media?.addEventListener?.("change", handlePreference);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(revealTimer);
      document.body.style.overflow = previousOverflow;
      media?.removeEventListener?.("change", handlePreference);
    };
  }, [finish, poster]);

  return (
    <section
      className={`${styles.prelude} ${poster ? styles.poster : ""}`}
      style={{ "--prelude-duration": `${PRELUDE_MS}ms` } as CSSProperties}
      aria-label={poster ? undefined : "Oyun açılışı"}
      aria-hidden={poster || undefined}
      data-opening={poster ? undefined : "board-prelude"}
      onKeyDown={(event) => {
        if (event.key === "Escape") finish();
        if (event.key === "Tab") { event.preventDefault(); skipRef.current?.focus(); }
      }}
      onAnimationEnd={(event) => { if (event.target === event.currentTarget) finish(); }}
    >
      <div className={styles.heading}>
        <span className={styles.eyebrow}>BAĞLARI KEŞFET</span>
        <h2>Her parça bir bütüne ait.</h2>
      </div>

      <svg className={styles.definitions} aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#fff8e9" />
            <stop offset=".56" stopColor="#e4d6bd" />
            <stop offset="1" stopColor="#c5b295" />
          </linearGradient>
          <linearGradient id={`${id}-metal`} x1=".15" y1="0" x2=".9" y2="1">
            <stop stopColor="#fffbea" />
            <stop offset=".19" stopColor="#d8953e" />
            <stop offset=".36" stopColor="#f2d7a9" />
            <stop offset=".48" stopColor="#fff6da" />
            <stop offset=".59" stopColor="#b38672" />
            <stop offset=".72" stopColor="#8183b4" />
            <stop offset=".82" stopColor="#dfbea7" />
            <stop offset=".95" stopColor="#966329" />
            <stop offset="1" stopColor="#f2d9ac" />
          </linearGradient>
          <radialGradient id={`${id}-core`} cx=".32" cy=".2" r=".88">
            <stop stopColor="#6684bf" />
            <stop offset=".35" stopColor="#344969" />
            <stop offset=".75" stopColor="#252835" />
            <stop offset="1" stopColor="#151f2e" />
          </radialGradient>
          <radialGradient id={`${id}-glow`} cx=".3" cy=".25" r=".72">
            <stop stopColor="#fffdf2" stopOpacity=".9" />
            <stop offset=".45" stopColor="#fff3d5" stopOpacity="0" />
            <stop offset="1" stopColor="#30271a" stopOpacity=".2" />
          </radialGradient>
          <g id={`${id}-art`}>
            <rect width="400" height="400" fill={`url(#${id}-paper)`} />
            <path d="M0 80H400M0 160H400M0 240H400M0 320H400M80 0V400M160 0V400M240 0V400M320 0V400" stroke="#604f39" strokeOpacity=".09" strokeWidth=".6" />
            <circle cx="207" cy="217" r="152" fill="#716050" opacity=".18" />
            <circle cx="200" cy="200" r="151" fill={`url(#${id}-metal)`} />
            <circle cx="200" cy="200" r="148" fill="none" stroke="#fff7df" strokeOpacity=".85" />
            {[137, 128, 119, 110, 101, 92, 83, 74].map((radius) => (
              <g key={radius}>
                <circle cx="200" cy="200" r={radius} fill="none" stroke="#4e392b" strokeOpacity=".28" strokeWidth="1.1" />
                <circle cx="199.6" cy="199.3" r={radius - 1.4} fill="none" stroke="#fff9e6" strokeOpacity=".68" strokeWidth="1.1" />
              </g>
            ))}
            <circle cx="200" cy="200" r="64" fill="#563e31" />
            <circle cx="200" cy="203" r="59" fill={`url(#${id}-core)`} />
            <path d="M161 196C168 166 192 153 220 161" fill="none" stroke="#8f9db2" strokeOpacity=".6" strokeWidth="1.2" />
            <circle cx="200" cy="200" r="151" fill={`url(#${id}-glow)`} />
            <path d="M30 38H44M37 31V45M356 362H370M363 355V369" stroke="#6f624d" strokeOpacity=".6" strokeWidth="1" />
            <path d="M32 368H88M312 32H368" stroke="#6f624d" strokeOpacity=".35" />
          </g>
        </defs>
      </svg>

      <div className={styles.stage} aria-hidden="true">
        <div className={styles.halo} />
        <div className={styles.orbit} />
        <div className={styles.ground} />
        <span className={`${styles.marker} ${styles.markerTop}`}>01 — 16</span>
        <span className={`${styles.marker} ${styles.markerBottom}`}>BÜTÜNÜ GÖR.</span>
        <div className={styles.sculpture}>
          {TILES.map(({ index, column, row }) => (
            <div
              className={styles.tile}
              key={index}
              style={{
                "--column": column,
                "--row": row,
                "--offset-x": `${(column - 1.5) * 12}%`,
                "--offset-y": `${(row - 1.5) * 12}%`,
                "--entry-x": `${column < 2 ? -1 : 1}`,
                "--entry-y": `${row < 2 ? -1 : 1}`,
                "--entry-angle": `${(column < 2 ? -1 : 1) * (18 + row * 3)}deg`,
                "--tile-delay": `${((column % 2) + (row % 2) * 2) * 35}ms`,
              } as CSSProperties}
            >
              <svg viewBox={`${column * 100} ${row * 100} 100 100`} className={styles.art}>
                <use href={`#${id}-art`} />
              </svg>
              <span className={styles.tileNumber}>{String(index + 1).padStart(2, "0")}</span>
              <span className={styles.sheen} />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.progress} aria-hidden="true"><span /></div>
        <p>16 kelime<span />4 gizli bağ<span />Bir keşif.</p>
        {!poster && <button ref={skipRef} className={styles.skip} onClick={finish} type="button">
          Oyuna geç <span aria-hidden="true">↗</span>
        </button>}
      </div>
    </section>
  );
}
