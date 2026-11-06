import type { Metadata } from "next";
import Link from "next/link";
import { ArcadeShell, ArcadeTitle } from "@/components/arcade/ArcadeShell";
import { SITE_ORIGIN } from "@/lib/config";
import styles from "@/app/nasil-oynanir/guide.module.css";

const title = "Kelime Gruplama Bulmacası Nasıl Çözülür? İpuçları ve Örnek";
const description = "Dört kelime arasındaki ortak bağı bulmak için örnekler, çift anlamlı kelimeler ve hata haklarını korumaya yönelik pratik stratejiler.";
export const metadata: Metadata = { title, description, alternates: { canonical: "/kelime-bulmacasi-ipuclari" }, openGraph: { title, description, url: `${SITE_ORIGIN}/kelime-bulmacasi-ipuclari` } };

const strategies = [
  { title: "Önce olası grupları not et", text: "16 kelimeyi tek tek okumak yerine ortak yönleri aramaya başla. Örneğin renkler, meslekler, mutfak araçları veya ulaşım biçimleri birer olası kategori olabilir. Henüz dört kelimeden emin değilsen grubu göndermeden bekle." },
  { title: "Birden fazla gruba uyabilecek kelimeleri ayır", text: "Bazı sözcükler farklı anlamlarıyla birden fazla gruba girebilir. Bir kelime iki farklı dörtlüde işe yarıyorsa hemen kullanma; diğer kelimelerden hangilerinin daha az alternatifi olduğuna bak." },
  { title: "Gizli dil bağlarını düşün", text: "Bağ her zaman aynı konu olmak zorunda değildir. Kelimeler aynı sözcükten önce veya sonra gelebilir, bir deyimi tamamlayabilir ya da ses ve yazım bakımından ortaklık taşıyabilir." },
  { title: "Son üç kelime de bağı açıklıyor mu?", text: "Bir grubu göndermeden önce dört kelimenin her biri için aynı ilişkiyi açıkça söyleyebildiğini kontrol et. Üçü uyuyor, dördüncüsü zorlama kalıyorsa alternatif aramak hata hakkını koruyabilir." },
  { title: "Tahtayı karıştır, bakış açını değiştir", text: "Yan yana duran kelimeler olmayan bir bağ varmış gibi hissettirebilir. Karıştır düğmesi kelimeleri değiştirir ama doğru grupları değiştirmez; takıldığında farklı dizilişler yeni ilişkileri görmene yardımcı olabilir." },
  { title: "Her yanlış tahminden bilgi çıkar", text: "Yanlış gönderdiğin dörtlüyü olduğu gibi tekrarlamak yerine hangi kelimenin başka bir kategoriye ait olabileceğini sorgula. Kalan hakkını ve çözülmüş gruplardan geriye kalan kelimeleri birlikte değerlendir." },
] as const;

export default function WordPuzzleTipsPage() {
  return <ArcadeShell active="play">
    <ArcadeTitle eyebrow="KELİME OYUNU REHBERİ" title="Kelime bağlantılarını bulma rehberi" description="Dört kelimenin ortak bağını ararken kullanabileceğin stratejiler." />
    <article className={styles.layout}>
      <section className={styles.intro}><span className={styles.eyebrow}>✦ KELİME GRUPLAMA</span><h2>Bir bağlantı bulmacasına nereden başlanır?</h2><p>Play Quadro&apos;da 16 kelimeyi ortak bağlantılarına göre dörderli dört gruba ayırırsın. Aşağıdaki yöntemler düşünmeyi düzenlemeye yardımcı olur; her bulmacanın tek bir çözüm yolu olduğunu veya bu yöntemlerin her zaman kazandıracağını varsaymaz.</p><div className={styles.actions}><Link className={styles.primary} href="/play?mode=daily">Günlük bulmacayı oyna →</Link><Link className={styles.secondary} href="/nasil-oynanir">Önce kuralları öğren</Link></div></section>
      <section className={styles.panel}><h2>Örnek: ortak kategoriyi bul</h2><p>Bir tahtada <strong>elma, armut, erik ve şeftali</strong> görüyorsan ortak bağları meyve olmaları olabilir. Fakat gerçek bir tahtada başka sözcükler de meyveyle ilişkiliyse, aynı dört kelimenin daha belirgin bir ortak özelliği olup olmadığını ve diğer gruplarda nelerin kalacağını da kontrol et. Bu, günlük bulmacanın cevabı değil, yalnızca bir düşünme örneğidir.</p></section>
      <section className={styles.section}><h2>Dört kelimelik grupları bulmak için altı yöntem</h2><div className={styles.stepGrid}>{strategies.map(item => <section className={styles.step} key={item.title}><h3>{item.title}</h3><p>{item.text}</p></section>)}</div></section>
      <section className={styles.panel}><h2>Farklı oyunlarda nasıl pratik yapabilirim?</h2><p>Günlük oyun dışında <Link href="/play">zorluk seviyelerine</Link>, 200 adımlık <Link href="/journey">Keşif Yolu&apos;na</Link> ve <Link href="/pictures">Resimli Quadro&apos;ya</Link> göz atabilirsin. Kurallar ve hata hakları seçtiğin moda göre farklılaşabilir.</p></section>
      <p className={styles.back}><Link href="/">← Quadro ana sayfasına dön</Link></p>
    </article>
  </ArcadeShell>;
}
