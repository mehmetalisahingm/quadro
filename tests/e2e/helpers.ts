/**
 * İlk çalışan akışın regresyon testleri için ortak yardımcılar (Q17).
 *
 * Testler jsdom içinde gerçek sayfa bileşenlerini (`/` ve `/play`) çizer, gerçek motorla oynar ve
 * kullanıcı gibi tıklar (`@testing-library/user-event`). Kart sırası motorun sabit tohumundan
 * geldiği için hangi kelimeye tıklanacağı önceden bilinir.
 *
 * İçerik Q19 günlük yayın katmanından, gerçek yolla gelir: `QUADRO_CONTENT_DIR` ve `QUADRO_TODAY`
 * testin sahte yayın stoğunu (`tests/fixtures/content/`) ve sabit bir yayın gününü gösterir, sayfa
 * da o günün dosyasını sunucuda okur. Dosyanın içeriği `standardPuzzle`'ın birebir aynısıdır
 * (`src/lib/daily/dailyPuzzle.test.ts` bunu denetler), dolayısıyla testler canlı günün cevaplarına
 * bağlı değildir ve onları ifşa etmez.
 *
 * Zaman tamamen sahte saatle ilerler: Grupla'daki geri bildirim geçişi (`setTimeout`) gerçek
 * beklemeyle değil {@link finishTransition} ile bitirilir.
 */

import { act, cleanup, configure, render, screen, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, vi } from "vitest";

import PlayPage from "@/app/play/page";
import { normalizeTr, type Puzzle } from "@/features/game/contracts";
import { standardPuzzle } from "@/features/game/fixtures/puzzles";

/** Testlerin sahte yayın stoğu; bkz. `tests/fixtures/content/README.md`. */
const TEST_CONTENT_DIR = "tests/fixtures/content/puzzles";

/** Testlerin sabitlediği yayın günü; bu güne ait içerik yayına açıktır. */
export const TEST_DAY_KEY = "2026-09-20";

/** Testlerde oynanan bulmaca; test içeriğinin `toPuzzle` sonrası birebir karşılığı. */
export const puzzle: Puzzle = standardPuzzle;

// Bilinçli dörtlüler (kelime metinleri). Gruplar: RENKLER, MEYVELER, GEZEGENLER, ŞEHİRLER.
export const MEYVELER = ["ELMA", "ARMUT", "KİRAZ", "İNCİR"] as const;
export const RENKLER = ["KIRMIZI", "MAVİ", "YEŞİL", "SARI"] as const;
export const GEZEGENLER = ["MARS", "VENÜS", "SATÜRN", "MERKÜR"] as const;
export const SEHIRLER = ["ADANA", "BURSA", "İZMİR", "MUĞLA"] as const;
/** 3 gezegen + 1 şehir: çok yakın. */
export const UC_GEZEGEN_BIR_SEHIR = ["MARS", "VENÜS", "SATÜRN", "ADANA"] as const;
/** Her gruptan en fazla iki kelime içeren, birbirinden farklı dört yanlış dörtlü. */
export const YANLISLAR = [
  ["MARS", "KIRMIZI", "ADANA", "MAVİ"],
  ["BURSA", "KIRMIZI", "VENÜS", "İZMİR"],
  ["MARS", "VENÜS", "ADANA", "BURSA"],
  ["ELMA", "MARS", "YEŞİL", "MUĞLA"],
] as const;

/**
 * Her akış testinin ortamını kurar: sahte saat, React act ortamı ve test sonunda temizlik.
 * Test dosyasının en üstünde bir kez çağrılır.
 */
export function registerFlowHooks(): void {
  beforeEach(() => {
    // Günlük yayın katmanı gerçek saat yerine sabit günü, gerçek stok yerine test içeriğini okur.
    vi.stubEnv("QUADRO_CONTENT_DIR", TEST_CONTENT_DIR);
    vi.stubEnv("QUADRO_TODAY", TEST_DAY_KEY);

    // Q20 ilerleme kaydı localStorage'da durur ve jsdom penceresi dosya boyunca aynıdır;
    // temizlenmezse bir testte oynanan oyun sonrakinde geri yüklenir.
    window.localStorage.clear();

    // Rol sorgularında her öğe için görünürlük hesabı (getComputedStyle) atlanır; jsdom'da pahalıdır.
    // Oyun ekranında gizli etkileşimli öğe olmadığından sorgu sonuçları değişmez.
    configure({ defaultHidden: true });
    // Zaman tamamen elde: geri bildirim geçişi (`setTimeout`), aktif süre sayacının
    // saniyelik vuruşu (`setInterval`) ve sayacın okuduğu an (`Date`) sahte saatten
    // gelir. Sayaç (Q21) gerçek `setInterval` ile çalışsaydı testler gerçek saate
    // bağlı olur ve vuruş `act()` dışında React durumu güncelleyebilirdi.
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"],
      now: new Date(`${TEST_DAY_KEY}T09:00:00.000Z`),
    });
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    // Testing Library her kullanıcı eyleminden sonra setTimeout(0) bekler ve sahte saati yalnız
    // global `jest` üzerinden ilerletir. Vitest saatini ona tanıtmazsak eylemler asılı kalır.
    vi.stubGlobal("jest", { advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms) });
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });
}

/** Sahte saatle çalışan kullanıcı; eylemler arasında gerçek bekleme yoktur. */
export function createUser(): UserEvent {
  return userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
}

/** `/play` sayfasını (sunucu bileşeni) oyun kipinde çizer ve kullanıcıyı döndürür. */
export async function openPlayPage(): Promise<UserEvent> {
  const page = await PlayPage({ searchParams: Promise.resolve({}) });
  render(page);
  return createUser();
}

/** Düğme etkileşime kapalı mı? */
export function isDisabled(element: HTMLElement): boolean {
  return element instanceof HTMLButtonElement && element.disabled;
}

const BOARD_LABEL = /^\d+ çözülmemiş kelimelik oyun tahtası$/;

/** Oyun tahtası; etiketi kalan kart sayısını söyler ("16 çözülmemiş kelimelik oyun tahtası"). */
export function board(): HTMLElement {
  return screen.getByLabelText(BOARD_LABEL);
}

/** Tahta çiziliyor mu? Oyun bitince tahtanın yerini sonuç ekranı alır. */
export function hasBoard(): boolean {
  return screen.queryByLabelText(BOARD_LABEL) !== null;
}

/** Tahtadaki kart metinleri, gösterim sırasıyla. */
export function tileTexts(): string[] {
  return within(board())
    .queryAllByRole("button")
    .map((tile) => tile.textContent ?? "");
}

// Sık çağrılan konum bulucular (kart, Grupla, kontroller) düğmeyi metniyle bulur. Adlı rol
// sorguları her çağrıda tüm düğmelerin erişilebilir adını jsdom'da pahalı stil sorgularıyla
// hesaplar ve aynı dosyada birkaç oyun bittikten sonra belirgin biçimde yavaşlar. Anlamsal
// doğrulamalar (bölge, makale, bağlantı, başlık) rol sorgularıyla yapılır.

/** Metni verilen kart. */
export function tile(text: string): HTMLElement {
  return within(board()).getByText(text, { selector: "button" });
}

/** Seçili kartların metinleri, tahtadaki sırayla. */
export function pressedTexts(): string[] {
  return within(board())
    .queryAllByRole("button", { pressed: true })
    .map((tile) => tile.textContent ?? "");
}

/** "n/4 seçili" göstergesi. */
export function selectionLabel(): string {
  return screen.getByText(/seçili$/).textContent ?? "";
}

/** Hata göstergesinin ekran okuyucuya bildirdiği kalan hak ("3 hata hakkı kaldı"). */
export function remainingMistakes(): number {
  return Number.parseInt(screen.getByText(/hata hakkı kaldı$/).textContent ?? "", 10);
}

/** Oyun geri bildirim satırının metni; satır yoksa (oyun bitti) boş. */
export function feedbackText(): string {
  const feedback = screen
    .queryAllByRole("status")
    .find((region) => region.hasAttribute("data-verdict"));
  return feedback?.textContent ?? "";
}

/** Sayfadaki düğmelerin metinleri; oyun bitince yalnız paylaşım eylemleri kalmalıdır. */
export function buttonTexts(): string[] {
  return screen.queryAllByRole("button").map((button) => button.textContent ?? "");
}

/** Grupla düğmesi; geçiş sırasında "Kontrol ediliyor…" yazar. */
export function submitButton(): HTMLElement {
  return screen.getByText(/^(Grupla|Kontrol ediliyor…)$/, { selector: "button" });
}

/** Adı verilen oyun kontrolü (Karıştır, Temizle); oyun bittiyse yoktur. */
export function control(name: "Karıştır" | "Temizle"): HTMLElement | null {
  return screen.queryByText(name, { selector: "button" });
}

/** Grupla sonrası geri bildirim geçişini sahte saatle bitirir; Grupla yeniden kullanılabilir. */
export function finishTransition(): void {
  act(() => {
    vi.runOnlyPendingTimers();
  });
}

/** Seçimi temizler (gerekirse) ve verilen kartları sırayla seçer. */
export async function selectWords(user: UserEvent, texts: readonly string[]): Promise<void> {
  const clear = control("Temizle");
  if (clear && !isDisabled(clear)) await user.click(clear);
  for (const text of texts) await user.click(tile(text));
}

/** Kartları seçer, Grupla'ya basar ve geçişi bitirir. */
export async function guess(user: UserEvent, texts: readonly string[]): Promise<void> {
  await selectWords(user, texts);
  await user.click(submitButton());
  finishTransition();
}

/** Başlığıyla sonuç bölümü ("Dört bağı da buldun." / "Bugünlük bu kadar."). */
export function resultRegion(title: string): HTMLElement {
  return screen.getByRole("region", { name: title });
}

/** Sonuç istatistiğinin değeri (Bulunan, Hata, Süre). */
export function statValue(region: HTMLElement, label: "Bulunan" | "Hata" | "Süre"): string {
  return within(region).getByText(label, { selector: "dt" }).nextElementSibling?.textContent ?? "";
}

/** Spoilersız paylaşım önizlemesinin metni. */
export function sharePreview(): string {
  return screen.getByLabelText("Spoilersız paylaşım önizlemesi").textContent ?? "";
}

/** Metinde bulmacanın herhangi bir kelimesi, başlığı veya açıklaması geçiyor mu? */
export function leakedAnswers(text: string): string[] {
  const haystack = normalizeTr(text);
  return puzzle.groups
    .flatMap((group) => [group.title, group.explanation, ...group.words.map((word) => word.text)])
    .filter((answer) => haystack.includes(normalizeTr(answer)));
}

/** Kimlikleri bulmacadaki kelime metinlerine çevirir. */
export function textsOf(wordIds: readonly string[]): string[] {
  const textById = new Map(
    puzzle.groups.flatMap((group) => group.words.map((word) => [word.id, word.text] as const)),
  );
  return wordIds.map((wordId) => textById.get(wordId) ?? wordId);
}
