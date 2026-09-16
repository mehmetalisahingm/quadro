import { HomeHero } from "@/components/home/HomeHero";

export default function HomePage() {
  return (
    <main className="q-page-shell">
      <HomeHero
        state="new"
        puzzleNumber={1}
        dateLabel="20 EYLÜL 2026"
      />
    </main>
  );
}
