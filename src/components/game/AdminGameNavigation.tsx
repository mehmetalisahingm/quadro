"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { GAME_ARCHIVE_DAYS } from "@/lib/gameArchive";
import { TRACK_LEVEL_COUNT, trackDay, trackHref } from "@/features/game/tracks";
import type { GameDifficulty } from "@/features/game/difficulty";
import styles from "./AdminGameNavigation.module.css";

/** Mount only after the existing server-backed admin check succeeds. */
export function AdminGameNavigation({ currentDay, trackDifficulty }: { currentDay?: string; trackDifficulty?: GameDifficulty }) {
  const id = useId();
  const days = trackDifficulty ? Array.from({ length: TRACK_LEVEL_COUNT }, (_, i) => trackDay(i + 1)) : GAME_ARCHIVE_DAYS;
  const href = (day: string) => trackDifficulty ? trackHref(trackDifficulty, days.indexOf(day) + 1) : `/play?day=${day}`;
  const [selectedDay, setSelectedDay] = useState(currentDay ?? days[0]!);
  const index = currentDay ? days.indexOf(currentDay) : -1;
  const previous = index > 0 ? days[index - 1] : null;
  const next = index >= 0 ? days[index + 1] : null;

  return (
    <section className={styles.panel} aria-label="Admin oyun kontrolleri">
      <div className={styles.heading}>
        <strong>Admin oyun alanı</strong>
        <span>∞ Sınırsız hata hakkı</span>
      </div>
      <p>Bölümü çözmeden ilerleyebilir, istediğin bulmacaya doğrudan geçebilirsin.</p>
      <div className={styles.controls}>
        <div className={styles.field}>
          <label htmlFor={id}>Bölüm seç</label>
          <select id={id} value={selectedDay} onChange={(event) => setSelectedDay(event.target.value)}>
            {days.map((day, number) => (
              <option key={day} value={day}>Bölüm {number + 1} · {day.split("-").reverse().join(".")}</option>
            ))}
          </select>
        </div>
        <Link className={styles.primary} href={href(selectedDay)}>Bölüme git ↗</Link>
      </div>
      <nav className={styles.links} aria-label="Admin bölüm gezintisi">
        {previous ? <Link href={href(previous)}>← Önceki bölüm</Link> : null}
        {next ? <Link href={href(next)}>Bölümü atla →</Link> : null}
        {currentDay ? <Link href="/admin">Yönetim paneli</Link> : null}
      </nav>
    </section>
  );
}
