import type { Metadata } from "next";
import Link from "next/link";
import { ArcadeShell, ArcadeTitle } from "@/components/arcade/ArcadeShell";
import { SITE_ORIGIN } from "@/lib/config";
import styles from "./guide.module.css";

const title = "Play Quadro Nasıl Oynanır? Kelime Gruplama Oyunu Rehberi";
const description = "16 kelimeyi dört gruba ayırdığın ücretsiz Türkçe bağlantı bulmacası Quadro'nun kurallarını, hata haklarını ve başlangıç ipuçlarını öğren.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/nasil-oynanir" },
  openGraph: { title, description, url: `${SITE_ORIGIN}/nasil-oynanir` },
};

const steps = [
  {
    number: "01",
    heading: "16 kelimeyi incele",
    text: "Her günlük bulmacada 16 farklı kelime görürsün. Amaç, bu kelimeleri ortak bir konuyla ilişkili dörderli dört gruba ayırmaktır. Bazen bir kelime birden fazla gruba uyuyormuş gibi görünebilir.",
  },
  {
    number: "02",
    heading: "Birbirine bağlı dört kelimeyi seç",
    text: "Aynı kategoride olduğunu düşündüğün dört kelimeyi işaretleyip seçimini gönder. Dördü de aynı gizli gruba aitse bağlantıyı bulmuş olursun.",
  },
  {
    number: "03",
    heading: "Hata haklarını koru",
    text: "Günlük bulmacada dört hata hakkın var. Emin olmadığın gruplarda acele etme; özellikle birden fazla anlama gelebilen kelimeleri tekrar düşün.",
  },
  {
    number: "04",
    heading: "Dört grubu tamamla",
    text: "Dört gizli bağı da bulduğunda günün bulmacasını bitirirsin. Yeni günlük oyun Türkiye saatiyle gece yarısında gelir.",
  },
] as const;

const tips = [
  { heading: "Önce açık bağlantıyı ara", text: "Renk, meslek, yiyecek veya ortak kullanım gibi doğrudan ilişkileri önce belirlemek kalan kelimeleri kolaylaştırabilir." },
  { heading: "Çift anlamlara dikkat et", text: "Bazı kelimeler ilk gördüğün gruba değil, daha az belirgin bir temaya ait olabilir. Kelimelere farklı anlamlarıyla bak." },
  { heading: "Tek bir kelimeye takılma", text: "Dörtlüyü seçmeden önce her kelimenin diğer üç kelimeyle neden ilişkili olduğunu açıklamaya çalış." },
] as const;

export default function HowToPlayPage() {
  return (
    <ArcadeShell active="play">
      <ArcadeTitle eyebrow="OYUN REHBERİ" title="Play Quadro nasıl oynanır?" description="Kelime gruplama oyununu öğren, bağlantıları keşfet ve ilk bulmacanı çöz." />
      <article className={styles.layout}>
        <section className={styles.intro} aria-labelledby="what-is-quadro">
          <span className={styles.eyebrow}>✦ QUADRO NEDİR?</span>
          <h2 id="what-is-quadro">Ücretsiz Türkçe günlük kelime bulmacası</h2>
          <p>Play Quadro, kelimeler arasındaki ortak özellikleri keşfetmeye dayanan, tarayıcıda oynanan bir bağlantı bulmacasıdır. Her oyunda 16 kelime ve saklı dört grup bulunur. Her grupta dört kelime yer alır. Oyunu oynamak için uygulama indirmen gerekmez.</p>
          <div className={styles.actions}>
            <Link href="/play?mode=daily" className={styles.primary}>Bugünün bulmacasını oyna →</Link>
            <Link href="/play?mode=tutorial" className={styles.secondary}>İnteraktif öğreticiyi aç</Link>
          </div>
        </section>
        <section aria-labelledby="how-to-play" className={styles.section}>
          <h2 id="how-to-play">Quadro oyununun kuralları</h2>
          <div className={styles.stepGrid}>
            {steps.map((step) => (
              <div className={styles.step} key={step.number}>
                <span className={styles.number}>{step.number}</span>
                <h3>{step.heading}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </section>
        <section aria-labelledby="game-tips" className={styles.section}>
          <h2 id="game-tips">Kelime gruplama için üç ipucu</h2>
          <div className={styles.tipGrid}>
            {tips.map((tip) => (
              <div className={styles.tip} key={tip.heading}>
                <h3>✧ {tip.heading}</h3>
                <p>{tip.text}</p>
              </div>
            ))}
          </div>
        </section>
        <section aria-labelledby="game-options" className={styles.panel}>
          <h2 id="game-options">Günlük bulmaca dışında neler var?</h2>
          <p>Quadro&apos;da <Link href="/play">Kolay, Orta, Zor ve Ultra Zor</Link> seviyelerini seçebilir, <Link href="/pictures">Resimli Quadro</Link> ile görsel bağlantıları arayabilir veya <Link href="/journey">Keşif Yolu</Link> bölümlerinde ilerleyebilirsin. <Link href="/challenges">Özel meydan okumalar</Link> bölümünde farklı oyun kurallarıyla oynanan modlar da bulunur.</p>
        </section>
        <section aria-labelledby="faq" className={styles.panel}>
          <h2 id="faq">Sık sorulan sorular</h2>
          <h3>Play Quadro ücretsiz mi?</h3>
          <p>Evet. Quadro&apos;yu web tarayıcısından ücretsiz açıp oynayabilirsin.</p>
          <h3>Her gün yeni bir oyun var mı?</h3>
          <p>Günlük bulmaca Türkiye saatiyle 00.00&apos;da yenilenir. Bunun dışında zorluk seviyelerine göre bölüm seçebilirsin.</p>
          <h3>Quadro&apos;yu telefondan oynayabilir miyim?</h3>
          <p>Evet. Oyun hem mobil tarayıcıda hem de bilgisayarda oynanacak şekilde tasarlanmıştır.</p>
          <h3>Kelime gruplama ile kelime tahmini aynı mı?</h3>
          <p>Hayır. Quadro&apos;da bir kelimenin harflerini tahmin etmek yerine, verilen kelimeler arasındaki ortak anlam veya bağlantıları bulursun.</p>
        </section>
        <p className={styles.back}><Link href="/kelime-bulmacasi-ipuclari">Kelime bağlantılarını bulmak için stratejileri oku →</Link></p>
        <p className={styles.back}><Link href="/">← Quadro ana sayfasına dön</Link></p>
      </article>
    </ArcadeShell>
  );
}
