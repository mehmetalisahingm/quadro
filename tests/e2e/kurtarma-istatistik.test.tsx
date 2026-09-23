import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StatsPage from "@/app/stats/page";
import { GameBoard } from "@/components/game/GameBoard";
import { GameLoading } from "@/components/game/GameLoading";
import { GameNotice } from "@/components/game/GameNotice";
import { standardPuzzle } from "@/features/game/fixtures";
import { STATS_SCHEMA_VERSION, STATS_STORAGE_KEY } from "@/lib/persistence/statsStore";
import { snapshotStorageKey } from "@/lib/persistence/snapshotStore";

beforeEach(() => { localStorage.clear(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function seedStats(count = 3) {
  const results = Array.from({ length: count }, (_, index) => ({
    dayKey: new Date(Date.UTC(2026, 8, index + 1)).toISOString().slice(0, 10),
    puzzleId: `test-${index}`,
    puzzleRevision: 1,
    outcome: count === 3 && index === 0 ? "lost" : "won",
    mistakes: count === 3 && index === 0 ? 4 : 1,
    streakEligible: true,
  }));
  const raw = JSON.stringify({ schemaVersion: STATS_SCHEMA_VERSION, results });
  localStorage.setItem(STATS_STORAGE_KEY, raw);
  return raw;
}

function metric(label: string) {
  const term = within(screen.getByLabelText("Kişisel istatistikler")).getByText(label);
  return term.parentElement?.querySelector("dd")?.textContent;
}

describe("Q24 · güvenli yükleme ve kurtarma", () => {
  it("yükleme tahtasında etkin oyun kontrolü bulunmaz", () => {
    render(<GameLoading />);
    expect(screen.getByLabelText("Bulmaca yükleniyor").getAttribute("aria-busy")).toBe("true");
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it.each(["malformed", JSON.stringify({ snapshot: { schemaVersion: 999 } })])(
    "okunamayan kayıt açıklanır ve önceki sonuçlar korunur: %s",
    (record) => {
      const history = seedStats();
      localStorage.setItem(snapshotStorageKey(standardPuzzle.date), record);
      render(<GameBoard puzzle={standardPuzzle} />);
      expect(screen.getByRole("heading", { name: /Kayıtlı ilerleme açılamadı|Kayıt bu sürümle uyuşmuyor/ })).toBeTruthy();
      expect(screen.getByLabelText("16 çözülmemiş kelimelik oyun tahtası")).toBeTruthy();
      expect(localStorage.getItem(STATS_STORAGE_KEY)).toBe(history);
    },
  );

  it("çevrimdışı tekrar denemede kayıt silinmez ve bağlantı mesajı çıkar", () => {
    const history = seedStats();
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    render(<GameNotice reason="unreadable" />);
    fireEvent.click(screen.getByRole("button", { name: "Yeniden dene" }));
    expect(screen.getByText(/İnternet bağlantısı yok/)).toBeTruthy();
    expect(localStorage.getItem(STATS_STORAGE_KEY)).toBe(history);
    expect(screen.getByRole("button", { name: "Yeniden dene" }).hasAttribute("disabled")).toBe(false);
  });
});

describe("Q25 · gerçek istatistik kaynağı", () => {
  it("ilk kullanıcıya boş durum gösterir, oran uydurmaz", async () => {
    render(<StatsPage />);
    await screen.findByText("İlk bağını kur.");
    expect(metric("Tamamlanan oyun")).toBe("0");
    expect(metric("Kazanma oranı")).toBe("—");
    expect(screen.getByText(/yalnızca bu tarayıcıya ait/)).toBeTruthy();
  });

  it("üç oyunun kazanma oranını, kaybını, serisini ve hata ortalamasını gösterir", async () => {
    const raw = seedStats();
    render(<StatsPage />);
    await screen.findByLabelText("Kişisel istatistikler");
    expect(metric("Tamamlanan oyun")).toBe("3");
    expect(metric("Kazanılan oyun")).toBe("2");
    expect(metric("Kazanma oranı")).toBe("%66,7");
    expect(metric("Ortalama hata")).toBe("2");
    expect(metric("Son seri")).toBe("2");
    expect(metric("En uzun seri")).toBe("2");
    expect(localStorage.getItem(STATS_STORAGE_KEY)).toBe(raw);
  });

  it("uzun seri ve başka sekmedeki değişiklik mevcut kaynaktan yenilenir", async () => {
    seedStats(30);
    render(<StatsPage />);
    await screen.findByLabelText("Kişisel istatistikler");
    expect(metric("En uzun seri")).toBe("30");
    expect(metric("Kazanma oranı")).toBe("%100");
    act(() => {
      seedStats(3);
      window.dispatchEvent(new StorageEvent("storage", { key: STATS_STORAGE_KEY }));
    });
    await waitFor(() => expect(metric("Tamamlanan oyun")).toBe("3"));
  });

  it("bozuk istatistik uyarısı günlük oyun kaydına dokunmaz", async () => {
    const key = snapshotStorageKey(standardPuzzle.date);
    localStorage.setItem(key, "saved-game-sentinel");
    localStorage.setItem(STATS_STORAGE_KEY, "broken");
    render(<StatsPage />);
    await screen.findByText(/İstatistik kaydı okunamadığı/);
    expect(localStorage.getItem(key)).toBe("saved-game-sentinel");
  });
});
