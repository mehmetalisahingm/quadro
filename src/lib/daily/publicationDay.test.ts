import { afterEach, describe, expect, it, vi } from "vitest";

import {
  PUBLICATION_TIME_ZONE,
  TODAY_ENV_VAR,
  formatDayLabel,
  isPublicationDayKey,
  publicationDayOf,
  resolvePublicationDay,
} from "./publicationDay";

/** Europe/Istanbul UTC+03; yayın günü UTC 21:00'de döner. */
const ISTANBUL_MIDNIGHT_2026_09_20 = "2026-09-19T21:00:00.000Z";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("yayın günü hesabı", () => {
  it("gece yarısından bir milisaniye önce hâlâ önceki gündür", () => {
    expect(publicationDayOf(new Date("2026-09-19T20:59:59.999Z"))).toBe("2026-09-19");
  });

  it("Türkiye gece yarısında gün döner", () => {
    expect(publicationDayOf(new Date(ISTANBUL_MIDNIGHT_2026_09_20))).toBe("2026-09-20");
  });

  it("gece yarısından bir milisaniye sonra yeni gündedir", () => {
    expect(publicationDayOf(new Date("2026-09-19T21:00:00.001Z"))).toBe("2026-09-20");
  });

  it("gün, oyuncunun saat diliminden değil Türkiye'den belirlenir", () => {
    // Aynı an: Los Angeles'ta 19 Eylül öğleden sonra, Auckland'da 20 Eylül sabahı.
    // Quadro her ikisine de aynı günü sunar.
    const an = new Date(ISTANBUL_MIDNIGHT_2026_09_20);
    expect(publicationDayOf(an, "America/Los_Angeles")).toBe("2026-09-19");
    expect(publicationDayOf(an, "Pacific/Auckland")).toBe("2026-09-20");
    expect(publicationDayOf(an, PUBLICATION_TIME_ZONE)).toBe("2026-09-20");
  });

  it("gün Avrupa yaz saati geçişlerinden etkilenmez", () => {
    // Avrupa'nın çoğu 29 Mart 2026 01:00 UTC'de yaz saatine geçer. Türkiye kalıcı
    // olarak UTC+03 kullandığı için o an İstanbul'da 04:00'tür ve gün değişmez;
    // aynı an Berlin'de kaydırma +01'den +02'ye çıkar.
    expect(publicationDayOf(new Date("2026-03-29T00:59:59.999Z"))).toBe("2026-03-29");
    expect(publicationDayOf(new Date("2026-03-29T01:00:00.000Z"))).toBe("2026-03-29");
    // Geçiş gecesinin kendi sınırı yine 21:00 UTC'dedir.
    expect(publicationDayOf(new Date("2026-03-28T20:59:59.999Z"))).toBe("2026-03-28");
    expect(publicationDayOf(new Date("2026-03-28T21:00:00.000Z"))).toBe("2026-03-29");
  });

  it("Türkiye'nin yaz saati uyguladığı yıllarda o günün gerçek kaydırması kullanılır", () => {
    // 2015'te Türkiye yaz saatindeydi (UTC+03); kışın kaydırma UTC+02'ydi. Sabit +03
    // varsayan bir hesap kış sınırını bir saat kaydırırdı.
    expect(publicationDayOf(new Date("2015-01-31T21:59:59.999Z"))).toBe("2015-01-31");
    expect(publicationDayOf(new Date("2015-01-31T22:00:00.000Z"))).toBe("2015-02-01");
    expect(publicationDayOf(new Date("2015-07-31T20:59:59.999Z"))).toBe("2015-07-31");
    expect(publicationDayOf(new Date("2015-07-31T21:00:00.000Z"))).toBe("2015-08-01");
  });

  it("ay ve yıl sınırlarını doğru çevirir", () => {
    expect(publicationDayOf(new Date("2026-12-31T20:59:59.999Z"))).toBe("2026-12-31");
    expect(publicationDayOf(new Date("2026-12-31T21:00:00.000Z"))).toBe("2027-01-01");
    // 2028 artık yıl: 29 Şubat gerçekten vardır.
    expect(publicationDayOf(new Date("2028-02-28T21:00:00.000Z"))).toBe("2028-02-29");
  });

  it("geçersiz bir an için anlaşılır biçimde durur", () => {
    expect(() => publicationDayOf(new Date("gecersiz"))).toThrow(RangeError);
  });
});

describe("gün anahtarı doğrulaması", () => {
  it("yalnız takvimde var olan YYYY-MM-DD günlerini kabul eder", () => {
    expect(isPublicationDayKey("2026-09-20")).toBe(true);
    expect(isPublicationDayKey("2028-02-29")).toBe(true);
    expect(isPublicationDayKey("2026-02-30")).toBe(false);
    expect(isPublicationDayKey("2026-9-20")).toBe(false);
    expect(isPublicationDayKey("20.09.2026")).toBe(false);
    expect(isPublicationDayKey("")).toBe(false);
    expect(isPublicationDayKey(undefined)).toBe(false);
    expect(isPublicationDayKey(20260920)).toBe(false);
  });
});

describe("yayın gününün çözümlenmesi", () => {
  it("saat verilmezse gerçek saatten hesaplar", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(ISTANBUL_MIDNIGHT_2026_09_20));
    expect(resolvePublicationDay()).toBe("2026-09-20");
  });

  it(`${TODAY_ENV_VAR} verilmişse gerçek saatin yerine geçer`, () => {
    vi.stubEnv(TODAY_ENV_VAR, "2026-09-24");
    expect(resolvePublicationDay({ now: new Date(ISTANBUL_MIDNIGHT_2026_09_20) })).toBe(
      "2026-09-24",
    );
  });

  it(`${TODAY_ENV_VAR} geçersizse yok sayılır ve gerçek gün sunulur`, () => {
    const uyari = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv(TODAY_ENV_VAR, "yarin");

    expect(resolvePublicationDay({ now: new Date(ISTANBUL_MIDNIGHT_2026_09_20) })).toBe(
      "2026-09-20",
    );
    expect(uyari).toHaveBeenCalledOnce();
    uyari.mockRestore();
  });

  it("boş ortam değişkeni sessizce yok sayılır", () => {
    const uyari = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv(TODAY_ENV_VAR, "   ");

    expect(resolvePublicationDay({ now: new Date(ISTANBUL_MIDNIGHT_2026_09_20) })).toBe(
      "2026-09-20",
    );
    expect(uyari).not.toHaveBeenCalled();
    uyari.mockRestore();
  });

  it("açıkça verilen override ortam değişkeninin önüne geçer", () => {
    vi.stubEnv(TODAY_ENV_VAR, "2026-09-24");
    expect(
      resolvePublicationDay({ now: new Date(ISTANBUL_MIDNIGHT_2026_09_20), override: "2026-09-22" }),
    ).toBe("2026-09-22");
  });
});

describe("gün etiketi", () => {
  it("gün anahtarını Türkçe arayüz etiketine çevirir", () => {
    expect(formatDayLabel("2026-09-20")).toBe("20 EYLÜL 2026");
    expect(formatDayLabel("2026-01-01")).toBe("1 OCAK 2026");
    expect(formatDayLabel("2026-12-09")).toBe("9 ARALIK 2026");
  });

  it("geçersiz anahtarı olduğu gibi döndürür", () => {
    expect(formatDayLabel("2026-13-01")).toBe("2026-13-01");
    expect(formatDayLabel("")).toBe("");
  });
});
