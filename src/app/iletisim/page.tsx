import type { Metadata } from "next";
import Link from "next/link";
import { ArcadeShell, ArcadeTitle } from "@/components/arcade/ArcadeShell";
import styles from "@/app/nasil-oynanir/guide.module.css";

export const metadata: Metadata = { title: "İletişim", alternates: { canonical: "/iletisim" } };

export default function ContactPage() {
  return <ArcadeShell>
    <ArcadeTitle title="İletişim" description="Quadro hakkında öneriler ve teknik geri bildirimler." />
    <article className={styles.layout}>
      <section className={styles.panel}><h2>Öneri ve hata bildirimi</h2><p>Oyunla ilgili teknik sorunları veya geliştirme önerilerini <a href="https://github.com/mehmetalisahingm/quadro">Quadro&apos;nun herkese açık GitHub projesi</a> üzerinden iletebilirsin. Bir hatayı bildirirken oyun modunu, cihaz türünü ve hatanın nasıl ortaya çıktığını açıklamak yardımcı olur.</p></section>
      <section className={styles.panel}><h2>Kişisel bilgiler</h2><p>GitHub üzerindeki açık bildirimlerde e-posta adresi, parola, oturum bilgisi veya başka kişisel veri paylaşma. Verilerin nasıl işlendiğini <Link href="/gizlilik-politikasi">gizlilik ve çerez politikası</Link> sayfasından öğrenebilirsin.</p></section>
      <p className={styles.back}><Link href="/">← Ana sayfaya dön</Link></p>
    </article>
  </ArcadeShell>;
}
