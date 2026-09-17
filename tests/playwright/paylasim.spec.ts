import { expect, test } from "@playwright/test";

import { bulmaca, oyunuKazan, paylasimMetni, spoilerMetinleri } from "./yardimcilar";

test("Kopyala panoya spoilersız sonuç metnini yazar", async ({ context, page }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  await page.goto("/play");
  await oyunuKazan(page);

  await page.getByRole("button", { name: "Kopyala", exact: true }).click();
  await expect(page.getByText("Sonuç panoya kopyalandı.", { exact: true })).toBeVisible();

  const panodakiHam = await page.evaluate(() => navigator.clipboard.readText());
  const panoMetni = panodakiHam.split("\r\n").join("\n");

  expect(panoMetni).toBe(await paylasimMetni(page));
  expect(panoMetni).toContain(`Quadro ${bulmaca.date} 4/4`);
  expect(panoMetni).toMatch(/[🟨🟩🟦🟪]/u);

  for (const spoiler of spoilerMetinleri()) {
    expect(panoMetni).not.toContain(spoiler);
  }
});
