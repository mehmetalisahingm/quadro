// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openConsentPreferences, readConsent, saveConsent } from "@/lib/consent";

import { ConsentBanner } from "./ConsentBanner";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("çerez şeridi", () => {
  it("karar yokken görünür; Reddet ve Kabul et aynı vurguda yan yanadır", () => {
    render(<ConsentBanner />);
    const reject = screen.getByRole("button", { name: "Reddet" });
    const accept = screen.getByRole("button", { name: "Kabul et" });
    expect(reject.className).toBe(accept.className);
    expect(screen.getByRole("link", { name: "Ayrıntılar" }).getAttribute("href")).toBe("/gizlilik-politikasi");
  });

  it("Reddet tek tıkla kaydedilir ve şerit kapanır", () => {
    render(<ConsentBanner />);
    fireEvent.click(screen.getByRole("button", { name: "Reddet" }));
    expect(readConsent()).toMatchObject({ analytics: false, ads: false });
    expect(screen.queryByTestId("consent-banner")).toBeNull();
  });

  it("reklam açık değilken Kabul et reklam onayı vermez", () => {
    render(<ConsentBanner />);
    fireEvent.click(screen.getByRole("button", { name: "Kabul et" }));
    expect(readConsent()).toMatchObject({ analytics: true, ads: false });
  });

  it("reklam açıkken kategoriler ayrı ayrı seçilebilir", () => {
    render(<ConsentBanner adsAvailable />);
    fireEvent.click(screen.getByRole("button", { name: "Ayarla" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Analitik/ }));
    fireEvent.click(screen.getByRole("button", { name: "Seçimi kaydet" }));
    expect(readConsent()).toMatchObject({ analytics: true, ads: false });
  });

  it("karar verildiyse görünmez; footer bağlantısıyla yeniden açılır ve değiştirilebilir", () => {
    saveConsent({ analytics: true, ads: false });
    render(<ConsentBanner />);
    expect(screen.queryByTestId("consent-banner")).toBeNull();

    act(() => openConsentPreferences());
    const analytics = screen.getByRole("checkbox", { name: /Analitik/ }) as HTMLInputElement;
    expect(analytics.checked).toBe(true);
    fireEvent.click(analytics);
    fireEvent.click(screen.getByRole("button", { name: "Seçimi kaydet" }));
    expect(readConsent()?.analytics).toBe(false);
    expect(screen.queryByTestId("consent-banner")).toBeNull();
  });
});
