import type { Metadata } from "next";
import Link from "next/link";
import { ArcadeShell, ArcadeTitle } from "@/components/arcade/ArcadeShell";
import { ConsentPreferencesButton } from "@/components/consent/ConsentPreferencesButton";
import styles from "@/app/nasil-oynanir/guide.module.css";

export const metadata: Metadata = { title: "Gizlilik ve çerez politikası", alternates: { canonical: "/gizlilik-politikasi" } };

/*
 * TASLAK: Bu metin hukuki kontrolden geçmeden kesinleşmiş sayılmaz. Kontrolde
 * özellikle doğrulanacaklar: veri sorumlusunun kimliği ve iletişim kanalı, KVKK
 * yurt dışına aktarım dayanağı (PostHog, Supabase), saklama süreleri ve bu
 * sürelerin teknik olarak uygulanması, VERBİS yükümlülüğü.
 */
export default function PrivacyPage() {
  return <ArcadeShell>
    <ArcadeTitle title="Gizlilik ve çerez politikası" description="Quadro'da hangi verilerin neden işlendiği ve tercihlerini nasıl değiştireceğin." />
    <article className={styles.layout}>
      <section className={styles.panel}>
        <h2>Kısaca</h2>
        <p>Quadro&apos;yu hesap açmadan ve ölçüme izin vermeden oynayabilirsin. Ölçüm ve reklam çerezleri yalnız sen çerez şeridinde izin verirsen çalışır. İzin vermezsen oyun aynen çalışır. Kararını istediğin zaman sayfanın altındaki &quot;Çerez tercihleri&quot; bağlantısından değiştirebilirsin.</p>
        <div className={styles.actions}><ConsentPreferencesButton className={styles.secondary} /></div>
      </section>

      <section className={styles.panel}>
        <h2>Zorunlu depolama (izin gerekmez)</h2>
        <p>Oyunun çalışması için tarayıcının yerel depolamasında şunlar tutulur: oyun ilerlemen ve istatistiklerin, ses gibi ayarların, çerez tercihin ve giriş yaptıysan oturum bilgin. Bu kayıtlar cihazında kalır; oyun ilerlemesi yalnız hesabına giriş yaptıysan hesabınla eşleştirilir. Teknik hata kayıtları da yalnız tarayıcında tutulur ve sunucuya gönderilmez.</p>
      </section>

      <section className={styles.panel}>
        <h2>Analitik ölçüm (yalnız izinle)</h2>
        <p>İzin verirsen, oyunu iyileştirmek için şu anonim kullanım verilerini toplarız:</p>
        <ul>
          <li>Bulmacayı başlatma ve bitirme: mod (günlük, kolay, orta, zor, ultra zor ve diğer modlar), bölüm veya gün, sonuç, hata sayısı, süre ve kullanılan ipucu sayısı.</li>
          <li>Sonucu paylaşma veya kopyalama, ipucu kullanma.</li>
          <li>Hangi bağlantıdan geldiğin (ör. bir kampanya etiketi), ziyaret ettiğin sayfa adresleri ve sonraki günlerde geri dönüp dönmediğin.</li>
          <li>Bu ziyaretleri birbirine bağlamak için cihazında rastgele oluşturulan bir ziyaretçi kimliği. Bu kimlik adınla, e-postanla ya da hesabınla eşleştirilmez.</li>
        </ul>
        <p>E-posta adresin, adın, seçtiğin kelimeler ve bulmaca cevapları ölçüme hiçbir zaman eklenmez. Ölçüm hizmetinde IP adresi saklanmayacak şekilde yapılandırılmıştır.</p>
        <p>Kullandığımız hizmetler: ürün analitiği için PostHog (Avrupa Birliği, Frankfurt sunucuları) ve Quadro&apos;nun kendi ölçüm veritabanı (Supabase). Bu hizmetlerin sunucuları Türkiye dışında olduğu için verilerin yurt dışına aktarılır; aktarım açık rızana dayanır.</p>
        <p>Saklama süresi: ölçüm kayıtları en fazla 12 ay saklanır, sonra silinir veya anonim hale getirilir.</p>
      </section>

      <section className={styles.panel}>
        <h2>Google reklamları</h2>
        <p>Reklamlar şu an kapalıdır. Etkinleştirildiğinde, reklam çerezleri yalnız çerez şeridinde reklam iznini verirsen yüklenir. Bu durumda Google ve reklam teknolojisi sağlayıcıları reklam sunumu, ölçüm, kötüye kullanımın önlenmesi ve izin verilen durumlarda kişiselleştirme için çerezler, yerel depolama, IP adresi ve cihaz bilgileri gibi verileri kullanabilir. Ayrıntılar için <a href="https://policies.google.com/technologies/partner-sites?hl=tr">Google&apos;ın iş ortağı siteleri açıklamasına</a> ve <a href="https://myadcenter.google.com/">Google Reklam Merkezim</a> sayfasına bakabilirsin.</p>
      </section>

      <section className={styles.panel}>
        <h2>İzni reddetme ve geri alma</h2>
        <p>Çerez şeridinde &quot;Reddet&quot;i seçersen hiçbir ölçüm veya reklam aracı yüklenmez ve cihazına ölçüm kimliği yazılmaz. Daha önce izin verdiysen, sayfanın altındaki &quot;Çerez tercihleri&quot; bağlantısından izni geri alabilirsin; bu durumda cihazındaki ölçüm kayıtları hemen silinir ve yeni veri gönderilmez. Sunucuya önceden gönderilmiş kayıtların silinmesini aşağıdaki kanaldan isteyebilirsin. Tercihin 12 ay sonra yeniden sorulur.</p>
      </section>

      <section className={styles.panel}>
        <h2>Hakların ve iletişim</h2>
        <p>6698 sayılı KVKK&apos;nın 11. maddesi kapsamında verilerinin işlenip işlenmediğini öğrenme, düzeltilmesini veya silinmesini isteme ve itiraz etme haklarına sahipsin. Talepler ve sorular için <Link href="/iletisim">iletişim sayfasındaki</Link> kanalı kullan. Açık hata bildirimlerinde kişisel veya hesap bilgilerini paylaşma.</p>
      </section>
      <p className={styles.back}><Link href="/">← Ana sayfaya dön</Link></p>
    </article>
  </ArcadeShell>;
}
