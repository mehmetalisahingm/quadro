import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadJourneyPuzzle } from "@/lib/daily/journeyPuzzle";
import { JourneyStage } from "@/components/journey/JourneyStage";
export const metadata: Metadata = { title: "Keşif Yolu · Adım adım öğren", description: "Her adım yeni bir bağlantı. Bulmacayı tamamla ve yolculuğuna devam et." };
export default async function JourneyStepPage({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const step = Number((await searchParams).level ?? 1);
  const puzzle = await loadJourneyPuzzle(step);
  if (!puzzle) notFound();
  return <main className="q-play-page"><JourneyStage key={puzzle.id} step={step} puzzle={puzzle} /></main>;
}
