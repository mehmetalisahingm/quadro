/**
 * İstemci paketi içerik denetimi (Q19).
 *
 * Kabul ölçütü: "Gelecek gün dosyaları ve editoryal kayıtlar istemci paketinde
 * bulunmuyor." Bu komut derlenmiş çıktıyı tarayarak o ölçütü doğrular; kaynak
 * düzeyindeki hızlı karşılığı `src/lib/daily/clientBundle.test.ts` içindedir.
 *
 * Taranan yerler:
 *
 * - `.next/static/**` — her tarayıcıya giden, derleme anında sabitlenmiş paketler.
 *   Burada **hiçbir** günlük bulmacanın içeriği bulunmamalıdır: bulmaca istemciye istek
 *   anında, sunucu bileşeninin ürettiği veriyle iner; derleme çıktısına girmez.
 * - Numaralı mod bulmacalarının tekil kelimeleri arayüzde çakışabileceğinden,\n *   modlar için güçlü kimlikler ve aynı gruptaki iki kelime aranır.\n * - `.next/server/app/**` altındaki önceden çizilmiş `.html` ve `.rsc` dosyaları —
 *   yalnız günlük yayın için derleme anındaki yayın gününün içeriği bulunabilir; başka bir günün
 *   içeriği burada görünüyorsa o gün zamanından önce yayılmış demektir.
 *
 * Aranan izler her içerik dosyasının bulmaca kimliği, grup başlıkları, çözüm
 * açıklamaları ve kelime metinleridir; tırnak içinde aranır ki sıradan metinlere
 * yanlışlıkla takılmasın. Editoryal kayıtlar (`src/content/editorial/`) ve kör
 * tahtalar aynı açıklama ve kelimeleri taşıdığı için bu izlerle birlikte denetlenir.
 *
 * Kullanım: `npm run check:bundle` (önce `npm run build`).
 * Çıkış kodu: sızıntı varsa 1, yoksa 0. Derleme çıktısı yoksa 1.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const buradan = dirname(fileURLToPath(import.meta.url));
const kok = resolve(buradan, "..");
const bulmacaDizini = join(kok, "src", "content", "puzzles");
const statikDizin = join(kok, ".next", "static");
const sunucuUygulamaDizini = join(kok, ".next", "server", "app");

/** Depo köküne göre okunur yol. */
const yol = (mutlak) => relative(kok, mutlak).split("\\").join("/");

/** Dizindeki tüm dosyaları, verilen uzantılarla süzerek toplar. */
function dosyalariTopla(dizin, uzantilar) {
  if (!existsSync(dizin)) return [];

  const bulunan = [];
  const yuru = (simdiki) => {
    for (const girdi of readdirSync(simdiki, { withFileTypes: true })) {
      const tam = join(simdiki, girdi.name);
      if (girdi.isDirectory()) {
        yuru(tam);
        continue;
      }
      if (uzantilar.length === 0 || uzantilar.includes(extname(girdi.name))) bulunan.push(tam);
    }
  };

  yuru(dizin);
  return bulunan;
}

/** Bir içerik dosyasının paket içinde aranacak izleri. */
function izleriCikar(bulmaca) {
  const izler = new Set();
  if (typeof bulmaca.id === "string") izler.add(bulmaca.id);

  for (const grup of Array.isArray(bulmaca.groups) ? bulmaca.groups : []) {
    if (typeof grup?.title === "string") izler.add(grup.title);
    if (typeof grup?.explanation === "string") izler.add(grup.explanation);
    for (const kelime of Array.isArray(grup?.words) ? grup.words : []) {
      if (typeof kelime?.text === "string") izler.add(kelime.text);
    }
  }

  return [...izler];
}

/**
 * İzi metinde arar. Paketlenmiş JSON'da değerler tırnak içinde durur; küçültücü
 * tırnakları kaçırmış olabilir. İkisi de aranır, çıplak metin aranmaz.
 */
function izGeciyorMu(icerik, iz) {
  return icerik.includes(`"${iz}"`) || icerik.includes(`\\"${iz}\\"`);
}

if (!existsSync(join(kok, ".next"))) {
  console.error("Derleme çıktısı yok. Önce `npm run build` çalıştırılmalı.");
  process.exit(1);
}

if (!existsSync(bulmacaDizini)) {
  console.error(`Bulmaca dizini bulunamadı: ${bulmacaDizini}`);
  process.exit(1);
}

const gunler = readdirSync(bulmacaDizini)
  .filter((ad) => ad.endsWith(".json"))
  .sort()
  .map((ad) => {
    const ham = JSON.parse(readFileSync(join(bulmacaDizini, ad), "utf8"));
    return { dosya: ad, gun: ad.replace(/\.json$/i, ""), izler: izleriCikar(ham) };
  });

const modDizini = join(kok, "src", "content", "modes");
if (existsSync(modDizini)) for (const ad of readdirSync(modDizini).filter(ad => ad.endsWith(".json"))) {
  const ham = JSON.parse(readFileSync(join(modDizini, ad), "utf8"));
  gunler.push({ dosya: `modes/${ad}`, gun: ham.date, izler: izleriCikar(ham), mod: true, kimlik: ham.id, gruplar: ham.groups });
}

if (gunler.length === 0) {
  console.error(`Denetlenecek içerik bulunamadı: ${bulmacaDizini}`);
  process.exit(1);
}

const statikDosyalar = dosyalariTopla(statikDizin, [".js", ".json", ".css"]);
const onCizilmisler = dosyalariTopla(sunucuUygulamaDizini, [".html", ".rsc"]);

console.log(
  `Quadro istemci paketi denetimi · ${gunler.length} gün · ` +
    `${statikDosyalar.length} statik dosya · ${onCizilmisler.length} önceden çizilmiş sayfa\n`,
);

if (statikDosyalar.length === 0) {
  console.error(`Statik paket bulunamadı: ${yol(statikDizin)}. Derleme eksik olabilir.`);
  process.exit(1);
}

/** Derleme anındaki yayın günü; önceden çizilmiş sayfada yalnız bu gün bulunabilir. */
const bugun = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Istanbul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

const bulgular = [];

// Daily puzzles remain strictly embargoed: even one word in a browser bundle fails.
// Public difficulty chapters are already playable by URL, so a single ordinary
// word such as "REST" or "SAHNE" in the UI is not evidence of a chapter leak.
// Their unique IDs, group titles, full explanations, or two words from one
// answer group still count as a leak. Client import-graph checks remain strict.
for (const dosya of statikDosyalar) {
  const icerik = readFileSync(dosya, "utf8");
  for (const giris of gunler) {
    const { dosya: kaynak, izler, mod, kimlik, gruplar } = giris;
    if (!mod) {
      for (const iz of izler) {
        if (izGeciyorMu(icerik, iz)) bulgular.push({ paket: yol(dosya), kaynak, iz });
      }
      continue;
    }
    const belirginIzler = [kimlik, ...gruplar.flatMap(grup => [grup.title, grup.explanation])];
    for (const iz of belirginIzler) {
      if (izGeciyorMu(icerik, iz)) bulgular.push({ paket: yol(dosya), kaynak, iz });
    }
    for (const grup of gruplar) {
      const eslesen = grup.words.map(kelime => kelime.text).filter(iz => izGeciyorMu(icerik, iz));
      if (eslesen.length >= 2) {
        bulgular.push({ paket: yol(dosya), kaynak, iz: `aynı gruptan ${eslesen.join(" + ")}` });
      }
    }
  }
}

for (const dosya of onCizilmisler) {
  const icerik = readFileSync(dosya, "utf8");
  for (const { dosya: kaynak, gun, izler, mod } of gunler) {
    // Unlike daily embargoed puzzles, numbered difficulty chapters are public.
    if (mod || gun === bugun) continue;
    for (const iz of izler) {
      if (izGeciyorMu(icerik, iz)) {
        bulgular.push({ paket: yol(dosya), kaynak, iz });
      }
    }
  }
}

if (bulgular.length > 0) {
  console.error("Bulmaca içerik sızıntısı istemci paketinde tespit edildi:\n");
  for (const bulgu of bulgular) {
    console.error(`  ${bulgu.paket} · ${bulgu.kaynak} · "${bulgu.iz}"`);
  }
  console.error(
    "\nİçerik yalnız `loadDailyPuzzle` ile, istek anında okunmalıdır; " +
      "statik içe aktarım tüm günleri pakete sokar.",
  );
  process.exit(1);
}

console.log(`Yayın günü (derleme anı): ${bugun}`);
console.log("Denetim başarılı: istemci paketinde günlük içerik yok.");
