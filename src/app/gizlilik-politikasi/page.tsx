import type { Metadata } from "next";
import Link from "next/link";
import { ArcadeShell, ArcadeTitle } from "@/components/arcade/ArcadeShell";
import styles from "@/app/nasil-oynanir/guide.module.css";

export const metadata: Metadata = { title: "Gizlilik ve çerez politikası", alternates: { canonical: "/gizlilik-politikasi" } };

export default function PrivacyPage() {
  return <ArcadeShell>
    <ArcadeTitle title="Gizlilik ve çerez politikası" description="Quadro'da kullanılan veriler, tarayıcı depolaması ve reklam tercihleri." />
    <article className={styles.layout}>
      <section className={styles.panel}><h2>Oyun ve hesap verileri</h2><p>Oyun ilerlemesi, istatistikler ve tercihler tarayıcının yerel depolamasında saklanabilir. Hesap kullanırsan oturum ve hesapla ilişkili oyun verileri hesap hizmeti üzerinden işlenebilir. Hizmetin sağlanması ve güvenliği için teknik istek kayıtları da oluşabilir.</p></section>
      <section className={styles.panel}><h2>Ölçüm ve teknik kayıtlar</h2><p>Quadro, oyun başlangıcı ve tamamlanması, ziyaret günleri, rastgele oluşturulan ziyaretçi kimliği ve kampanya etiketleri gibi ölçümleri ürünün kullanımını anlamak amacıyla kullanabilir. Teknik hata kayıtları tarayıcıda tutulabilir. Tarayıcı depolamasını temizlemek yerel kayıtları ve oyun ilerlemesini silebilir; sunucudaki kayıtları kendiliğinden silmez.</p></section>
      <section className={styles.panel}><h2>Google reklamları</h2><p>Reklam yayını etkinleştirildiğinde Google ve reklam teknolojisi sağlayıcıları reklam sunumu, ölçüm, kötüye kullanımın önlenmesi ve izin verilen durumlarda kişiselleştirme için çerezler, yerel depolama, IP adresi ve cihaz bilgileri gibi verileri kullanabilir. Üçüncü taraf sağlayıcılar çerez okuyabilir veya yerleştirebilir. Google reklam hizmetlerinin verileri nasıl kullandığını <a href="https://policies.google.com/technologies/partner-sites?hl=tr">Google&apos;ın iş ortağı siteleri açıklamasından</a> öğrenebilirsin.</p></section>
      <section className={styles.panel}><h2>Çerez ve reklam tercihleri</h2><p>Tarayıcı ayarlarından çerezleri ve site depolamasını yönetebilirsin. Reklamlar etkinleştirildiğinde, ilgili bölgelerde gösterilen Google gizlilik mesajından tercihlerini belirleyebilir veya değiştirebilirsin. Ayrıca <a href="https://myadcenter.google.com/">Google Reklam Merkezim</a> üzerinden Google reklam kişiselleştirme ayarlarını yönetebilirsin. Tarayıcı depolamasını engellemek bazı oyun ve hesap işlevlerini etkileyebilir.</p></section>
      <section className={styles.panel}><h2>Sorular ve talepler</h2><p>Gizlilikle ilgili iletişim yolları için <Link href="/iletisim">iletişim sayfasına</Link> bak. Açık hata bildirimlerinde kişisel veya hesap bilgilerini paylaşma.</p></section>
      <p className={styles.back}><Link href="/">← Ana sayfaya dön</Link></p>
    </article>
  </ArcadeShell>;
}
