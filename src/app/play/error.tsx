"use client";

import { GameNotice } from "@/components/game/GameNotice";

export default function Error() {
  return <main className="q-play-page"><GameNotice reason="unexpected" /></main>;
}
