export type PuzzleIntroTheme = "ocean" | "meadow" | "sky" | "sunrise" | "city";

export type PuzzleIntroScene = {
  theme: PuzzleIntroTheme;
  eyebrow: string;
  title: string;
  durationMs: number;
};

const THEMES: readonly PuzzleIntroTheme[] = ["ocean", "meadow", "sky", "sunrise", "city"];

const SCENES: Record<PuzzleIntroTheme, Omit<PuzzleIntroScene, "theme">> = {
  ocean: {
    eyebrow: "OKYANUS AKIŞI",
    title: "Dalgaların içinden bağlantıları bul",
    durationMs: 2580,
  },
  meadow: {
    eyebrow: "CANLANAN BAHÇE",
    title: "Parçalar çiçek gibi açılıyor",
    durationMs: 2580,
  },
  sky: {
    eyebrow: "AÇIK GÖKYÜZÜ",
    title: "Bulutların arasından tablo beliriyor",
    durationMs: 2520,
  },
  sunrise: {
    eyebrow: "İLK IŞIK",
    title: "Gün doğarken bağlantılar ortaya çıkıyor",
    durationMs: 2620,
  },
  city: {
    eyebrow: "ŞEHİR AKIŞI",
    title: "Hızın içinden 16 parçayı yakala",
    durationMs: 2460,
  },
};

export function introThemeForPuzzle(puzzleId: string): PuzzleIntroTheme {
  const numeric = Number.parseInt(puzzleId.match(/\d+/)?.[0] ?? "1", 10);
  const safeNumber = Math.max(1, Number.isFinite(numeric) ? numeric : 1);
  return THEMES[(safeNumber - 1) % THEMES.length] ?? "ocean";
}

export function puzzleIntroScene(puzzleId: string): PuzzleIntroScene {
  const theme = introThemeForPuzzle(puzzleId);
  return { theme, ...SCENES[theme] };
}
