"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { GameWelcome } from "./GameWelcome";
import { TrackNavigation } from "./TrackNavigation";
import { trackHref } from "@/features/game/tracks";
import { JourneyEntry } from "@/components/journey/JourneyEntry";

export function DifficultyLobby() {
  const router = useRouter();
  return <>
    <JourneyEntry />
    <GameWelcome distinctPuzzles onStart={(mode) => router.push(trackHref(mode))} />
    <TrackNavigation />
    <p style={{ textAlign: "center", margin: "24px 0" }}><Link href="/play?day=2026-09-20">Klasik 30 bölümlük arşiv →</Link></p>
  </>;
}
