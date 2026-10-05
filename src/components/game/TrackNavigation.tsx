"use client";

import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";
import { TRACKS, TRACK_LEVEL_COUNT, trackHref, trackDay, trackPuzzleId } from "@/features/game/tracks";
import type { GameDifficulty } from "@/features/game/difficulty";
import { trackStorageKey, TRACK_PROGRESS_EVENT } from "@/lib/persistence/trackStorage";
import { snapshotStorageKey } from "@/lib/persistence/snapshotStore";
import { parseStoredRecord } from "@/lib/persistence/record";
import styles from "./TrackNavigation.module.css";

const subscribe = (listener: () => void) => {
  window.addEventListener("storage", listener);
  window.addEventListener(TRACK_PROGRESS_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(TRACK_PROGRESS_EVENT, listener);
  };
};
const empty = () => "";
export function TrackNavigation({ difficulty, level }: { difficulty?: GameDifficulty; level?: number }) {
  const progress = useCallback(() => TRACKS.flatMap(mode => Array.from({ length: TRACK_LEVEL_COUNT }, (_, i) => {
    const id = trackPuzzleId(mode.id, i + 1);
    let raw: string | null = null;
    try { raw = window.localStorage.getItem(trackStorageKey(id, snapshotStorageKey(trackDay(i + 1)))); } catch { /* Storage can be disabled. */ }
    const record = parseStoredRecord(raw ?? "");
    return record.ok && record.record.snapshot.puzzleId === id ? record.record.snapshot.status : "new";
  })).join(","), []);
  const saved = useSyncExternalStore(subscribe, progress, empty).split(",");
  return <nav className={styles.panel} aria-label="Zorluk modları ve bölümler">
    <h2>Üç mod. Farklı bulmacalar.</h2>
    <p>Her modda 6 özgün bölüm. Bir moda geçince diğerindeki ilerlemen korunur.</p>
    <div className={styles.tracks}>{TRACKS.map((mode, index) => <section key={mode.id} data-active={difficulty === mode.id}>
      <h3>{mode.label}</h3><p>{mode.description}</p>
      <div className={styles.levels}>{Array.from({ length: TRACK_LEVEL_COUNT }, (_, i) => {
        const status = saved[index * TRACK_LEVEL_COUNT + i];
        const suffix = status === "won" ? " · Çözüldü" : status === "lost" ? " · Tamamlandı" : status === "playing" ? " · Devam et" : "";
        return <Link key={i} href={trackHref(mode.id, i + 1)} aria-current={difficulty === mode.id && level === i + 1 ? "page" : undefined} aria-label={`${mode.label} bölüm ${i + 1}${suffix}`} title={suffix || "Yeni bölüm"}>{i + 1}{status === "won" ? " ✓" : status === "playing" ? " •" : ""}</Link>;
      })}</div>
    </section>)}</div>
  </nav>;
}
