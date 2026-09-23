import type { Metadata } from "next";
import Link from "next/link";
import { StatsExperience } from "@/components/stats/StatsExperience";
import styles from "@/components/stats/Stats.module.css";

export const metadata: Metadata = {
  title: "İstatistiklerin",
  description: "Quadro günlük bulmaca sonuçların, kazanma serilerin ve kişisel istatistiklerin.",
};

export default function StatsPage() {
  return (
    <main className="q-play-page">
      <header className="q-play-header">
        <Link className="q-play-brand" href="/" aria-label="Quadro ana sayfasına dön">QUADRO</Link>
        <Link href="/play">Günün bulmacası</Link>
      </header>
      <section className={styles.shell} aria-labelledby="stats-title">
        <p className={styles.eyebrow}>SENİN QUADRO GÜNLÜĞÜN</p>
        <h1 id="stats-title" className={styles.title}>Küçük bir günlük alışkanlık.</h1>
        <p className={styles.intro}>Bu istatistikler yalnızca bu tarayıcıya ait. Başka cihazlarla eşitlenmez; tarayıcı verilerini silersen kaybolur.</p>
        <StatsExperience />
      </section>
    </main>
  );
}
