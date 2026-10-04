"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { GAME_ARCHIVE_DAYS } from "@/lib/gameArchive";
import styles from "./AdminGameNavigation.module.css";

/** Mount only after the existing server-backed admin check succeeds. */
export function AdminGameNavigation({ currentDay }: { currentDay?: string }) {
  const id = useId();
  const [selectedDay, setSelectedDay] = useState(currentDay ?? GAME_ARCHIVE_DAYS[0]!);
  const index = currentDay ? GAME_ARCHIVE_DAYS.indexOf(currentDay) : -1;
  const previous = index > 0 ? GAME_ARCHIVE_DAYS[index - 1] : null;
  const next = index >= 0 ? GAME_ARCHIVE_DAYS[index + 1] : null;

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
            {GAME_ARCHIVE_DAYS.map((day, number) => (
              <option key={day} value={day}>Bölüm {number + 1} · {day.split("-").reverse().join(".")}</option>
            ))}
          </select>
        </div>
        <Link className={styles.primary} href={`/play?day=${selectedDay}`}>Bölüme git ↗</Link>
      </div>
      <nav className={styles.links} aria-label="Admin bölüm gezintisi">
        {previous ? <Link href={`/play?day=${previous}`}>← Önceki bölüm</Link> : null}
        {next ? <Link href={`/play?day=${next}`}>Bölümü atla →</Link> : null}
        {currentDay ? <Link href="/admin">Yönetim paneli</Link> : null}
      </nav>
    </section>
  );
}
