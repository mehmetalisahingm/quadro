import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Gizlilik ve Kişisel Veriler",
  description: "Quadro hesap ve anonim kullanım verileri hakkında bilgilendirme.",
};

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "4rem 1.5rem", lineHeight: 1.75 }}>
      <h1>Gizlilik ve Kişisel Veriler</h1>
      <p><strong>Son güncelleme:</strong> 14 Kasım 2026</p>
      <p>
        Quadro hesabı olmadan da oynanabilir. Hesap oluşturan oyuncuların e-posta adresi
        kimlik doğrulama ve hesapla ilişkilendirilen oyun sonuçları için işlenir.
        Oyun, tarayıcıda oyun durumu ve tercihler saklar; sunucu tarafı anonim analitik
        kayıtları için kalıcı, rastgele oluşturulmuş bir ziyaretçi kimliği kullanılır.
      </p>
      <h2>İşlenen veri kategorileri</h2>
      <ul>
        <li>Hesap açıldığında e-posta, kullanıcı kimliği ve giriş bilgileri.</li>
        <li>Giriş yapmış oyuncuların kaydedilen oyun sonuçları.</li>
        <li>Rastgele ziyaretçi kimliği, kaba oyun kullanım olayları ve zamanları.</li>
        <li>Cihazda tutulan oyun ilerlemesi, seri ve tercihler.</li>
      </ul>
      <h2>Amaçlar ve altyapı</h2>
      <p>
        Bu veriler giriş işlemlerini gerçekleştirmek, sonuçları hesapta saklamak,
        oyun işlevlerini sunmak, teknik güvenliği sağlamak ve anonimleştirilmiş ürün
        kullanımını anlamak için kullanılır. Uygulama Vercel üzerinde barındırılır;
        kimlik doğrulama ve veritabanı için Supabase kullanılır.
      </p>
      <h2>Haklar ve saklama</h2>
      <p>
        6698 sayılı KVKK kapsamındaki erişim, düzeltme, silme ve diğer haklara
        ilişkin başvurular değerlendirilecektir. Tarayıcıdaki yerel kayıtları
        tarayıcı ayarlarından temizleyebilirsin. Sunucudaki kayıtların silinmesi
        aynı işlem değildir.
      </p>
      <p>
        <strong>Yayın öncesi tamamlanacak bilgiler:</strong> Veri sorumlusunun
        unvanı ve iletişim adresi, başvuru kanalı, saklama süreleri, hukuki
        sebepler ve yurt dışına aktarım değerlendirmesi. Bu sayfa bir teknik
        aydınlatma taslağıdır; bu bilgiler doğrulanmadan tam KVKK uyumu
        sağlandığı iddia edilmez.
      </p>
      <p><Link href="/">← Quadro ana sayfası</Link></p>
    </main>
  );
}
