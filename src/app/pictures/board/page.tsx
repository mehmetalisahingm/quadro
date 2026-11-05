import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PictureStage } from "@/components/pictures/PictureStage";
import { loadPicturePuzzle } from "@/lib/daily/picturePuzzle";

export const metadata: Metadata = {
  title: "Resimli Quadro · Tahta",
  description: "On altı çizimin içindeki dört gizli bağı bul.",
};

export default async function PictureBoardPage({ searchParams }: { searchParams: Promise<{ board?: string }> }) {
  const board = Number((await searchParams).board ?? 1);
  const puzzle = await loadPicturePuzzle(board);
  if (!puzzle) notFound();
  return <main className="q-play-page"><PictureStage key={puzzle.id} board={board} puzzle={puzzle} /></main>;
}
