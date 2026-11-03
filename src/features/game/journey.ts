import type { GameDifficulty } from "./difficulty";

export const JOURNEY_LENGTH = 30;
export const JOURNEY_WORLDS = [
  { title: "İlk İzler", subtitle: "Dört kelime, tek bağ", symbol: "✿" },
  { title: "Merak Ormanı", subtitle: "Tanıdık dünyalar", symbol: "♧" },
  { title: "Anlam Kıyısı", subtitle: "Sözcüklerin ötesi", symbol: "◒" },
  { title: "Çağrışım Tepeleri", subtitle: "İkinci anlamı keşfet", symbol: "◇" },
  { title: "Gizli Bağlar", subtitle: "Görünmeyen kelime", symbol: "✧" },
  { title: "Ustalık Göğü", subtitle: "Bütün resmi gör", symbol: "♛" },
] as const;
export const JOURNEY_LESSONS = [
  "İlk grubu birlikte bulalım: tahtadaki dört meyveyi seç ve Grupla’ya bas. Sonra aynı aileden diğer dörtlüleri ara.",
  "Her seçimin aynı gruptan olmasına dikkat et. Dört kelime seçilmeden Grupla açılmaz.",
  "Seçtiğin kelimeye tekrar dokunarak seçimini kaldırabilirsin. Acele etme; süre sınırı yok.",
  "Dört doğru grup oyunu bitirir. Doğru bulduğun grup tahtadan ayrılır; kalan kelimelere odaklan.",
  "Karıştır yalnızca kartların yerini değiştirir. Kelimeler ve gizli gruplar aynı kalır.",
  "Yanlış bir tahmin bir hata hakkı götürür. Aynı yanlış dörtlüyü yeniden göndermek çözüm getirmez.",
  "Bir kelime uzaktasın uyarısı, seçtiğin dört kelimeden üçünün aynı grupta olduğunu söyler.",
  "Kategori ipucu bir grubun adını açar. İhtiyacın olursa kullan; bu yol öğrenmek için var.",
  "Bir alanın mesleklerini, araçlarını veya parçalarını aynı grupta arayabilirsin.",
  "Bir kelime birkaç şeyi çağrıştırabilir. Bağın seçtiğin dört kelimenin hepsine uymasını iste.",
  "Bağ her zaman nesnelerin türü değildir. Aynı işte kullanılan şeyler de birlikte durabilir.",
  "Önce en emin olduğun dörtlüyü bul. Kalan tahtayı küçültmek belirsizliği azaltır.",
  "Bazen dört kelimenin sonuna aynı sözcük gelir. Tam ifadeleri zihninde yüksek sesle kur.",
  "Eşyanın parçaları, ilk bakışta farklı alanlardan gelen sözcüklerle adlandırılabilir.",
  "Sadece anlamı değil, sözcüğün günlük dilde nerede kullanıldığını da düşün.",
  "Bir grubu bulunca diğer kelimeleri o fikre zorla uydurma. Her grubun bağı farklı olabilir.",
  "Artık daha az destek var. Tanıdık kelimelerin ikinci anlamlarını yokla.",
  "Dört kelimeyi aynı ortak sözcükle tamamlayabiliyor musun? Her ifadeyi ayrı ayrı kontrol et.",
  "Bağ bazen bir yerin, etkinliğin veya işlemin parçaları arasında saklanır.",
  "En kısa kelime en kolay kelime olmayabilir. Anlamını bağlamla birlikte düşün.",
  "Başına ya da sonuna eklenen görünmez bir sözcük aramayı dene.",
  "Bir kelime iki gruba aday görünüyorsa, iki olasılık için de tam bir dörtlü kurmayı dene.",
  "Tahmini göndermeden önce dört kelimenin de aynı kuralla uyduğundan emin ol.",
  "Son grubu elemeden önce onun da bağlantısını kendin açıklamaya çalış.",
  "Ustalık bölümlerinde kategori ipucu ve yakınlık uyarısı yok. Bağın tutarlılığına güven.",
  "Yalnız anlamı değil, harfleri ve sözcük yapısını da incele.",
  "Gizli bir sözcük veya ortak bir ifade, çok farklı anlamları bir araya getirebilir.",
  "Harf oyunu düşündüğünde, kuralın dört kelimeye de aynı biçimde uygulandığını kontrol et.",
  "Bir çağrışım tek başına yetmez. Dört kelimeyi kapsayan en açık açıklamayı ara.",
  "Son keşif: öğrendiğin tüm yolları kullan. Kaybedersen tekrar dene; yolculuğun burada silinmez.",
] as const;
export function journeyDifficulty(step: number): GameDifficulty {
  return step <= 8 ? "easy" : step <= 16 ? "medium" : step <= 24 ? "hard" : "ultra";
}
export function journeyId(step: number) { return `journey-${String(step).padStart(3, "0")}`; }
export function journeyStep(id: string): number | null {
  const match = /^journey-(\d{3})$/.exec(id);
  const step = match ? Number(match[1]) : 0;
  return step >= 1 && step <= JOURNEY_LENGTH ? step : null;
}
export function journeyDay(step: number) { return new Date(Date.UTC(2026, 10, 2 + step)).toISOString().slice(0, 10); }
export function journeyHref(step: number) { return `/journey/step?level=${step}`; }
