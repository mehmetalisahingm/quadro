import Link from "next/link";

import type { PictureBoardProgress } from "@/lib/persistence/pictureProgress";

import styles from "@/components/stats/Stats.module.css";

/** Resimli sonuçlar burada ayrı sayılır; günlük seri ve oranlara hiçbir zaman eklenmez. */
export function PictureStatsPanel({ progress }: { progress: readonly PictureBoardProgress[] }) {
  const won = progress.filter((board) => board.status === "won").length;
  const lost = progress.filter((board) => board.status === "lost").length;

  return (
    <section className={styles.panel} aria-labelledby="picture-stats-title">
      <h2 id="picture-stats-title">Resimli Quadro</h2>
      <p>Yukarıdaki sayılar yalnız günlük oyuna aittir. Resimli tahtaların sonuçları burada ayrı tutulur.</p>
      <dl className={styles.outcomes}>
        <div><dt>Tamamlanan tahta</dt><dd>{won}/{progress.length}</dd></div>
        <div><dt>Kaybedilen tahta</dt><dd>{lost}</dd></div>
      </dl>
      <div className={styles.actions}>
        <Link className={`${styles.action} ${styles.secondary}`} href="/pictures">Resimli tahtalar</Link>
      </div>
    </section>
  );
}
