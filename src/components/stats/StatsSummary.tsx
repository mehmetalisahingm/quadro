import Link from "next/link";
import type { PersonalStats } from "@/features/game/scoring";
import styles from "./Stats.module.css";

const decimal = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 });

export function StatsSummary({ stats }: { stats: PersonalStats }) {
  const empty = stats.played === 0;
  const metrics = [
    ["Son seri", stats.currentStreak],
    ["En uzun seri", stats.longestStreak],
    ["Tamamlanan oyun", stats.played],
    ["Kazanma oranı", empty ? "—" : `%${decimal.format(stats.winRate)}`],
    ["Kazanılan oyun", stats.won],
    ["Ortalama hata", empty ? "—" : decimal.format(stats.averageMistakes)],
  ];

  return (
    <>
      <dl className={styles.grid} aria-label="Kişisel istatistikler">
        {metrics.map(([label, value]) => (
          <div className={styles.metric} key={label}><dt>{label}</dt><dd>{value}</dd></div>
        ))}
      </dl>
      <p className={styles.note}>Seriler gün cinsindendir ve son kaydedilen günlük sonuca göre gösterilir. Ortalama hata, tamamlanan oyun başına kullanılan hata hakkıdır.</p>
      {empty ? (
        <section className={styles.panel} aria-labelledby="stats-empty-title">
          <h2 id="stats-empty-title">İlk bağını kur.</h2>
          <p>Henüz tamamlanmış bir günlük oyunun yok. İlk oyununu bitirdiğinde sonuçların burada birikmeye başlayacak. Öğretici istatistiklere eklenmez.</p>
          <Link className={styles.action} href="/play">Bugünün bulmacasını çöz</Link>
        </section>
      ) : (
        <section className={styles.panel} aria-labelledby="stats-outcomes-title">
          <h2 id="stats-outcomes-title">Her gün, yeni bir deneme.</h2>
          <p>{stats.played} tamamlanan oyunun {stats.won} tanesinde dört bağı da buldun.</p>
          <div className={styles.track} aria-hidden="true"><span style={{ width: `${stats.winRate}%` }} /></div>
          <dl className={styles.outcomes}>
            <div><dt>Kazanılan</dt><dd>{stats.won}</dd></div>
            <div><dt>Kaybedilen</dt><dd>{stats.lost}</dd></div>
          </dl>
          <div className={styles.actions}>
            <Link className={styles.action} href="/play">Günün bulmacasına dön</Link>
            <Link className={`${styles.action} ${styles.secondary}`} href="/">Ana sayfa</Link>
          </div>
        </section>
      )}
    </>
  );
}
