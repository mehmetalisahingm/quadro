/**
 * Quadro içerik doğrulama komutu (Q18).
 *
 * `src/content/puzzles/*.json` altındaki tüm günlük bulmacaları, varsa kör
 * tahtalarını ve dosyalar arası kuralları resmi doğrulayıcıdan geçirir.
 * Kural tanımları burada değil `src/features/game/validator/index.ts` içindedir;
 * bu dosya yalnız dosya sistemini okur ve sonucu yazdırır.
 *
 * Kullanım: `npm run validate:content`
 * Çıkış kodu: en az bir `error` varsa 1, yoksa 0. Uyarılar çıkış kodunu etkilemez.
 *
 * Node 22.18 ve sonrası TypeScript dosyalarını yerel olarak çalıştırır; ek bir
 * derleme adımı veya bağımlılık gerekmez.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const buradan = dirname(fileURLToPath(import.meta.url));
const kok = resolve(buradan, "..");
const bulmacaDizini = join(kok, "src", "content", "puzzles");
const korDizini = join(kok, "src", "content", "editorial", "blind");
const editoryalDizin = join(kok, "src", "content", "editorial");

/** Doğrulayıcıyı yükler; Node'un TypeScript desteği yoksa anlaşılır bir mesajla durur. */
async function dogrulayiciyiYukle() {
  const yol = pathToFileURL(join(kok, "src", "features", "game", "validator", "index.ts")).href;
  try {
    return await import(yol);
  } catch (hata) {
    console.error(
      "Doğrulayıcı yüklenemedi. Bu komut, TypeScript dosyalarını yerel olarak " +
        "çalıştırabilen Node 22.18 veya üstünü gerektirir (depo .nvmrc ile Node 22'ye sabitlidir).",
    );
    console.error(String(hata));
    process.exit(1);
  }
}

const {
  formatIssue,
  hasErrors,
  validateBlindBoard,
  validatePuzzle,
  validatePuzzleSet,
} = await dogrulayiciyiYukle();

/** JSON dosyasını okur; okunamazsa veya bozuksa doğrulayıcı biçiminde bir sorun döndürür. */
function jsonOku(yol, kaynak) {
  try {
    return { value: JSON.parse(readFileSync(yol, "utf8")), issues: [] };
  } catch (hata) {
    return {
      value: null,
      issues: [
        {
          code: "json-parse",
          severity: "error",
          path: ".",
          message: `Dosya okunamadı veya geçerli JSON değil: ${String(hata)}`,
          source: kaynak,
        },
      ],
    };
  }
}

if (!existsSync(bulmacaDizini)) {
  console.error(`Bulmaca dizini bulunamadı: ${bulmacaDizini}`);
  process.exit(1);
}

const dosyalar = readdirSync(bulmacaDizini)
  .filter((ad) => ad.endsWith(".json"))
  .sort();

if (dosyalar.length === 0) {
  console.error(`Doğrulanacak bulmaca bulunamadı: ${bulmacaDizini}`);
  process.exit(1);
}

const girdiler = [];
const tumSorunlar = [];
let hataliDosyaSayisi = 0;

console.log(`Quadro içerik doğrulaması · ${dosyalar.length} bulmaca\n`);

for (const dosya of dosyalar) {
  const okuma = jsonOku(join(bulmacaDizini, dosya), dosya);
  const sorunlar = [...okuma.issues];

  if (okuma.value !== null) {
    girdiler.push({ source: dosya, value: okuma.value });
    sorunlar.push(
      ...validatePuzzle(okuma.value, { requireEditorialFields: true }).map((sorun) => ({
        ...sorun,
        source: dosya,
      })),
    );

    // Kör tahta ve editoryal kayıt yoksa bu bir yayın engeli değildir; uyarı olarak bildirilir.
    const korYolu = join(korDizini, dosya);
    if (existsSync(korYolu)) {
      const korOkuma = jsonOku(korYolu, `blind/${dosya}`);
      if (korOkuma.value === null) {
        sorunlar.push(...korOkuma.issues);
      } else {
        sorunlar.push(
          ...validateBlindBoard(okuma.value, korOkuma.value).map((sorun) => ({
            ...sorun,
            source: `blind/${dosya}`,
          })),
        );
      }
    } else {
      sorunlar.push({
        code: "blind-not-object",
        severity: "warning",
        path: ".",
        message: "Kör tahta dosyası yok; isteğe bağlı kör deneme için oluşturulabilir.",
        source: `blind/${dosya}`,
      });
    }

    const editoryalYol = join(editoryalDizin, dosya.replace(/\.json$/i, ".md"));
    if (!existsSync(editoryalYol)) {
      sorunlar.push({
        code: "blind-not-object",
        severity: "warning",
        path: ".",
        message: "Editoryal kayıt dosyası (.md) yok.",
        source: dosya,
      });
    }
  }

  tumSorunlar.push(...sorunlar);
  const hatalar = sorunlar.filter((sorun) => sorun.severity === "error");
  const uyarilar = sorunlar.filter((sorun) => sorun.severity === "warning");
  if (hatalar.length > 0) hataliDosyaSayisi += 1;

  const durum = hatalar.length > 0 ? "HATALI" : uyarilar.length > 0 ? "UYARILI" : "temiz";
  console.log(`${dosya} — ${durum}`);
  for (const sorun of sorunlar) console.log(`  ${formatIssue(sorun)}`);
}

const kumeSorunlari = validatePuzzleSet(girdiler);
if (kumeSorunlari.length > 0) {
  console.log("\nDosyalar arası kurallar:");
  for (const sorun of kumeSorunlari) console.log(`  ${formatIssue(sorun)}`);
}
tumSorunlar.push(...kumeSorunlari);

const toplamHata = tumSorunlar.filter((sorun) => sorun.severity === "error").length;
const toplamUyari = tumSorunlar.filter((sorun) => sorun.severity === "warning").length;

console.log(
  `\nÖzet: ${dosyalar.length} dosya · ${toplamHata} hata · ${toplamUyari} uyarı` +
    (hataliDosyaSayisi > 0 ? ` · ${hataliDosyaSayisi} dosyada hata var` : ""),
);

if (hasErrors(tumSorunlar)) {
  console.error("\nDoğrulama başarısız: yukarıdaki hatalar giderilmeli.");
  process.exit(1);
}

console.log("Doğrulama başarılı.");
