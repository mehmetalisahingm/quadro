"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import type { HomeHeroProps } from "@/components/home/HomeHero";
import { JOURNEY_LENGTH } from "@/features/game/journey";
import { PICTURE_BOARD_COUNT } from "@/features/game/pictures";
import { TRACK_LEVEL_COUNT, TRACKS, trackDay, trackHref, trackPuzzleId } from "@/features/game/tracks";
import { emptyJourneySnapshot, journeyProgressSnapshot, subscribeJourney, type JourneyProgress } from "@/lib/persistence/journeyProgress";
import { emptyPictureSnapshot, pictureProgressSnapshot, subscribePictures, type PictureBoardProgress } from "@/lib/persistence/pictureProgress";
import { parseStoredRecord } from "@/lib/persistence/record";
import { snapshotStorageKey } from "@/lib/persistence/snapshotStore";
import { trackStorage } from "@/lib/persistence/trackStorage";
import { ArcadeShell, ArcadeTitle } from "./ArcadeShell";
import { NavigationPending } from "./NavigationPending";
import styles from "./ArcadeHome.module.css";

const modes = [
  { id: "risk", title: "Risk", symbol: "🎲", detail: "Puanını ortaya koy.", href: "/play?mode=risk" },
  { id: "ladder", title: "Çarpan Merdiveni", symbol: "📈", detail: "Devam et, kazancını katla.", href: "/play?mode=ladder" },
  { id: "bomb", title: "Bomba Kart", symbol: "💣", detail: "Bombayı doğru yerde kullan.", href: "/play?mode=bomb" },
] as const;

function trackSnapshot() {
  return JSON.stringify(TRACKS.map((track) => {
    let done = 0;
    for (let level = 1; level <= TRACK_LEVEL_COUNT; level++) {
      const id = trackPuzzleId(track.id, level);
      const parsed = parseStoredRecord(trackStorage(id).getItem(snapshotStorageKey(trackDay(level))) ?? "");
      if (parsed.ok && parsed.record.snapshot.puzzleId === id && parsed.record.snapshot.status === "won") done++;
    }
    return done;
  }));
}
const emptyTracks = () => "";

export function ArcadeHome({ state, puzzleNumber, dateLabel, progressLabel, nextPuzzleLabel, previousGame }: HomeHeroProps) {
  const journeyRaw = useSyncExternalStore(subscribeJourney, journeyProgressSnapshot, emptyJourneySnapshot);
  const picturesRaw = useSyncExternalStore(subscribePictures, pictureProgressSnapshot, emptyPictureSnapshot);
  const tracksRaw = useSyncExternalStore(subscribeJourney, trackSnapshot, emptyTracks);
  const journey: JourneyProgress | null = journeyRaw ? JSON.parse(journeyRaw) : null;
  const pictures: PictureBoardProgress[] | null = picturesRaw ? JSON.parse(picturesRaw) : null;
  const tracks: number[] | null = tracksRaw ? JSON.parse(tracksRaw) : null;
  const pictureWins = pictures?.filter((item) => item.status === "won").length;
  const dailyLabel = state === "in-progress" ? "Kaldığın yerden devam et" : state === "completed" ? "Sonucunu gör" : "Bugünün bulmacasını çöz";
  const dailyHref = state === "completed" ? "/play?mode=daily&view=result" : "/play?mode=daily";

  return <ArcadeShell>
    <ArcadeTitle title="Bugünün bağlarını keşfet" description="Küçük bir merak, yepyeni bir keşif." />
    <section className={styles.daily} aria-label="Günün bulmacası">
      <div className={styles.calendar} aria-hidden="true"><span>BUGÜN</span><strong>{dateLabel.split(" ")[0]}</strong><small>{dateLabel.split(" ")[1]}</small></div>
      <div className={styles.dailyCopy}><span className={styles.kicker}>✦ GÜNLÜK BULMACA {puzzleNumber !== null ? ` · #${puzzleNumber}` : ""}</span><h2>Bugünün bulmacası</h2><p>Dört kelimenin ortak bağını bul, dört grubu tamamla.</p>
        {progressLabel && <p className={styles.progressText} aria-live="polite">{progressLabel}</p>}
        <Link href={dailyHref} className={styles.goldButton}><span aria-hidden="true">▶</span> {dailyLabel} <span aria-hidden="true">›</span><NavigationPending /></Link>
        <div className={styles.countdown} aria-label="Yeni bulmaca zamanı"><span>Yeni bulmaca · {nextPuzzleLabel}</span><span>Türkiye saatiyle 00.00</span></div>
      </div>
      <div className={styles.letterTiles} aria-hidden="true"><i>Q</i><i>U</i><i>A</i><i>D</i></div>
    </section>
    {previousGame && <aside className={styles.previous} aria-label="Yarım kalan önceki oyun"><div><strong>{previousGame.dateLabel}</strong><span>{previousGame.progressLabel}</span></div><Link href={previousGame.href}>Önceki oyuna devam et</Link></aside>}
    <div className={styles.featureGrid}>
      <Link href="/journey" className={`${styles.feature} ${styles.journey}`}><div><span className={styles.icon}>✧</span><h2>Keşif Yolu</h2><p>Bölümleri tamamla,<br />yeni dünyaları keşfet.</p></div><div className={styles.featureFooter}><span>📍 {journey ? `${journey.unlocked}. adım` : "Yolculuğa başla"}</span><strong>{journey ? `${journey.complete} / ${JOURNEY_LENGTH}` : "→"}</strong></div></Link>
      <Link href="/pictures" className={`${styles.feature} ${styles.pictures}`}><div><span className={styles.icon}>▧</span><h2>Resimli Quadro</h2><p>Görsellerin arasındaki<br />gizli bağı bul.</p></div><Image className={styles.pictureArt} src="/images/pictures/mode-entry.svg" alt="" width={165} height={165} unoptimized /><div className={styles.featureFooter}><span>Görsellerle oyna</span><strong>{pictureWins !== undefined ? `${pictureWins} / ${PICTURE_BOARD_COUNT} tahta` : "→"}</strong></div></Link>
    </div>
    <h2 className={styles.sectionTitle}><span>▥</span> Zorluk seviyelerine göre oyna</h2>
    <div className={styles.trackGrid}>{TRACKS.map((track, index) => <Link key={track.id} href={trackHref(track.id)} className={styles.track} data-track={track.id}><span className={styles.trackIcon}>{["❧","▥","◆","♛"][index]}</span><strong>{track.label}<NavigationPending /></strong><small>{track.description}</small><span className={styles.trackProgress}>✦ {tracks ? `${tracks[index]} / ${TRACK_LEVEL_COUNT} bölüm` : `${TRACK_LEVEL_COUNT} bölüm`}</span></Link>)}</div>
    <h2 className={styles.sectionTitle}><span>🏆</span> Özel meydan okumalar</h2>
    <div className={styles.modeGrid}>{modes.map((mode) => <Link href={mode.href} key={mode.id} className={styles.mode} data-mode={mode.id}><span className={styles.modeArt} aria-hidden="true">{mode.symbol}</span><strong>{mode.title}</strong><p>{mode.detail}</p><span className={styles.smallButton}>▶ Oyna <b>›</b><NavigationPending /></span></Link>)}</div>
    <div className={styles.more}><Link href="/challenges">Tüm özel modları keşfet →</Link><Link href="/play?mode=tutorial">Nasıl oynanır? →</Link></div>
    <section className={styles.guidePreview} aria-labelledby="quadronasiloynanir">
      <div>
        <span className={styles.guideKicker}>✧ YENİ BAŞLAYANLAR İÇİN</span>
        <h2 id="quadronasiloynanir">Play Quadro nasıl oynanır?</h2>
        <p>Quadro, 16 kelime arasında dört gizli bağlantı bulduğun Türkçe bir kelime gruplama oyunudur. Dörderli grupları keşfet, dört hata hakkını dikkatli kullan ve günlük bulmacayı tamamla.</p>
      </div>
      <Link href="/nasil-oynanir">Kuralları ve ipuçlarını keşfet <span aria-hidden="true">→</span></Link>
    </section>
  </ArcadeShell>;
}

