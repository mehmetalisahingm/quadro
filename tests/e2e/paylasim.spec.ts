/**
 * Paylaşımın tarayıcı regresyonu.
 *
 * Panoya gerçekten yazılan metin okunur: `navigator.clipboard` yalnız güvenli bağlamda ve
 * izin verilmiş gerçek tarayıcıda çalışır, bu yüzden bu kontrol taklit edilemez.
 */

import { expect, test } from "@playwright/test";

import { bulmaca, oyunuKazan, paylasimMetni, spoilerMetinleri } from "./yardimcilar";

test("Kopyala panoya spoilersız sonuç metnini yazar", async ({ context, page }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  await page.goto("/play");
  await oyunuKazan(page);

  await page.getByRole("button", { name: "Kopyala", exact: true }).click();
  await expect(page.getByText("Sonuç panoya kopyalandı.", { exact: true })).toBeVisible();

  const panodakiHam = await page.evaluate(() => navigator.clipboard.readText());

  // Windows panosu satır sonlarını CRLF'e çevirir, Linux'ta LF kalır. Karşılaştırma
  // işletim sistemine bağlı olmasın diye satır sonları tek biçime indirilir.
  const panoMetni = panodakiHam.split("\r\n").join("\n");

  // Panodaki metin ekrandaki önizlemenin birebir aynısı olmalı.
  expect(panoMetni).toBe(await paylasimMetni(page));

  expect(panoMetni).toContain(`Quadro ${bulmaca.date} 4/4`);
  expect(panoMetni).toMatch(/[🟨🟩🟦🟪]/u);

  // Asıl koruma: hiçbir kelime ve kategori başlığı paylaşım metnine sızmamalı.
  for (const spoiler of spoilerMetinleri()) {
    expect(panoMetni).not.toContain(spoiler);
  }
});
