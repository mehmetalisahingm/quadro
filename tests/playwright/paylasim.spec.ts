import { expect, test } from "@playwright/test";

import { bulmaca, oyunuKazan, paylasimMetni, spoilerMetinleri } from "./yardimcilar";

test("Kopyala spoilersız sonuç metnini tarayıcıya uygun yolla sunar", async ({
  browserName,
  context,
  page,
}) => {
  if (browserName === "chromium") {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  } else {
    // Playwright WebKit `clipboard-write` iznini desteklemiyor. Uygulamanın da
    // desteklenmeyen pano API'sinde gerçek kullanıcıya sunduğu fallback yolunu
    // deterministik olarak doğrula; bunu gerçek Safari/iOS cihaz kanıtı sayma.
    await page.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, "clipboard", {
        configurable: true,
        get: () => undefined,
      });
    });
  }

  await page.goto("/play");
  await oyunuKazan(page);

  const beklenenMetin = await paylasimMetni(page);
  await page.getByRole("button", { name: "Kopyala", exact: true }).click();

  let kopyalananMetin: string;
  if (browserName === "chromium") {
    await expect(page.getByText("Sonuç panoya kopyalandı.", { exact: true })).toBeVisible();
    const panodakiHam = await page.evaluate(() => navigator.clipboard.readText());
    kopyalananMetin = panodakiHam.split("\r\n").join("\n");
  } else {
    await expect(
      page.getByText("Otomatik kopyalama kullanılamadı. Metni aşağıdan seçebilirsin.", {
        exact: true,
      }),
    ).toBeVisible();
    const fallback = page.getByLabel("Paylaşım metni");
    await expect(fallback).toBeVisible();
    kopyalananMetin = (await fallback.inputValue()).split("\r\n").join("\n");
  }

  expect(kopyalananMetin).toBe(beklenenMetin);
  expect(kopyalananMetin).toContain(`Quadro ${bulmaca.date} 4/4`);
  expect(kopyalananMetin).toMatch(/[🟨🟩🟦🟪]/u);

  for (const spoiler of spoilerMetinleri()) {
    expect(kopyalananMetin).not.toContain(spoiler);
  }
});
