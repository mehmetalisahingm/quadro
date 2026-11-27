import type { Metadata } from "next";
import Link from "next/link";
import { ArcadeShell, ArcadeTitle } from "@/components/arcade/ArcadeShell";
import styles from "@/app/nasil-oynanir/guide.module.css";

export const metadata: Metadata = { title: "Quadro hakkında", alternates: { canonical: "/hakkimizda" } };

export default function AboutPage() {
  return <ArcadeShell>
    <ArcadeTitle title="Quadro hakkında" description="Türkçe kelimeler arasındaki gizli bağlantıları keşfet." />
    <article className={styles.layout}>
      <section className={styles.panel}><h2>Quadro nedir?</h2><p>Quadro, tarayıcıdan oynanan ücretsiz Türkçe bağlantı bulmacasıdır. Günlük oyunda 16 kelimeyi dört ortak bağlantı altında gruplandırırsın. Yeni günlük bulmaca Türkiye saatiyle gece yarısı yayınlanır.</p></section>
      <section className={styles.panel}><h2>Farklı oyun deneyimleri</h2><p>Günlük oyun dışında zorluk seviyeleri, Keşif Yolu, resimli bulmacalar ve özel meydan okumalar bulunur. Amaç kelimelerin farklı anlamlarını düşünmek ve ortak ilişkileri keşfetmektir. Kurallar oyun moduna göre değişebilir.</p></section>
      <section className={styles.panel}><h2>Oyunu keşfet</h2><p><Link href="/nasil-oynanir">Oyun kuralları</Link> ve <Link href="/kelime-bulmacasi-ipuclari">çözüm stratejileri</Link> başlangıç için yol gösterir. Oyunla ilgili önerilerini <Link href="/iletisim">iletişim sayfasındaki</Link> yöntemle iletebilirsin.</p></section>
      <p className={styles.back}><Link href="/">← Ana sayfaya dön</Link></p>
    </article>
  </ArcadeShell>;
}
