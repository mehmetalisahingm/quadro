"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { JOURNEY_LENGTH } from "@/features/game/journey";
import { PICTURE_BOARD_COUNT } from "@/features/game/pictures";
import { AUTH_SESSION_EVENT, displayNameForUser, readStoredSession } from "@/lib/auth/client";
import { emptyJourneySnapshot, journeyProgressSnapshot, subscribeJourney, type JourneyProgress } from "@/lib/persistence/journeyProgress";
import { emptyPictureSnapshot, pictureProgressSnapshot, subscribePictures, type PictureBoardProgress } from "@/lib/persistence/pictureProgress";
import { loadPersonalStats, STATS_STORAGE_KEY } from "@/lib/persistence/statsStore";
import { ArcadeShell, ArcadeTitle } from "./ArcadeShell";
import styles from "./ArcadeHub.module.css";

export function ArcadePassport() {
  const journeyRaw = useSyncExternalStore(subscribeJourney, journeyProgressSnapshot, emptyJourneySnapshot);
  const pictureRaw = useSyncExternalStore(subscribePictures, pictureProgressSnapshot, emptyPictureSnapshot);
  const journey: JourneyProgress | null = journeyRaw ? JSON.parse(journeyRaw) : null;
  const pictures: PictureBoardProgress[] | null = pictureRaw ? JSON.parse(pictureRaw) : null;
  const [daily, setDaily] = useState<number | null>(null);
  const [player, setPlayer] = useState("Misafir oyuncu");
  useEffect(() => {
    const sync = () => {
      setDaily(loadPersonalStats().stats.played);
      const session = readStoredSession();
      setPlayer(session ? displayNameForUser(session.user) : "Misafir oyuncu");
    };
    const timer = window.setTimeout(sync, 0);
    const storage = (event: StorageEvent) => { if (event.key === STATS_STORAGE_KEY || event.key === null) sync(); };
    window.addEventListener("storage", storage);
    window.addEventListener(AUTH_SESSION_EVENT, sync);
    window.addEventListener("focus", sync);
    return () => { window.clearTimeout(timer); window.removeEventListener("storage", storage); window.removeEventListener(AUTH_SESSION_EVENT, sync); window.removeEventListener("focus", sync); };
  }, []);
  const pictureWins = pictures?.filter((item) => item.status === "won").length ?? 0;
  const stars = journey?.stars.reduce((sum, value) => sum + value, 0) ?? 0;
  const achievements = [
    { icon: "✦", title: "İlk bağ", detail: "Bir günlük bulmaca tamamla.", earned: daily !== null && daily > 0 },
    { icon: "⌖", title: "İlk keşif", detail: "Keşif Yolu’nda ilk adımı tamamla.", earned: (journey?.complete ?? 0) > 0 },
    { icon: "▧", title: "Görsel avcısı", detail: "Bir resimli tahtayı tamamla.", earned: pictureWins > 0 },
  ];
  return <ArcadeShell active="passport">
    <ArcadeTitle title="Quadro Pasaportu" description="Oyna, keşfet ve yolculuğunun izlerini biriktir." />
    <section className={`${styles.panel} ${styles.withArt}`}><span className={styles.eyebrow}>OYUNCU PASAPORTU</span><h2>{player}</h2><p>Her doğru bağlantı yolculuğunun bir parçası. İlerlemen bu tarayıcıda saklanır.</p><Image className={styles.heroArt} src="/images/pictures/mode-entry.svg" width={200} height={200} alt="" unoptimized />
      <div className={styles.stats}><div className={styles.stat}><strong>{daily ?? "—"}</strong><span>Günlük oyun</span></div><div className={styles.stat}><strong>{journey?.complete ?? "—"}</strong><span>Keşif adımı</span></div><div className={styles.stat}><strong>{journey ? stars : "—"}</strong><span>Yıldız</span></div></div>
    </section>
    <h2 className={styles.sectionTitle}>✦ Oyun modu ilerlemen</h2>
    <div className={styles.grid3}><Link className={styles.card} href="/journey"><span className={styles.cardIcon}>🧭</span><strong>Keşif Yolu</strong><small>Yeni dünyalara doğru yola çık.</small><em>{journey ? `${journey.complete} / ${JOURNEY_LENGTH} adım` : "İlerleme yükleniyor…"}</em></Link>
      <Link className={styles.card} href="/play?mode=daily"><span className={styles.cardIcon}>▦</span><strong>Günlük Bulmaca</strong><small>Her gün yeni bir bağlantı.</small><em>{daily === null ? "İlerleme yükleniyor…" : `${daily} tamamlanan oyun`}</em></Link>
      <Link className={styles.card} href="/pictures"><span className={styles.cardIcon}>🖼️</span><strong>Resimli Quadro</strong><small>Görsellerin arasındaki bağı bul.</small><em>{pictures ? `${pictureWins} / ${PICTURE_BOARD_COUNT} tahta` : "İlerleme yükleniyor…"}</em></Link></div>
    <section className={styles.panel}><div className={styles.titleRow}><h2>🏆 Başarıların</h2><strong>{achievements.filter((item) => item.earned).length} / {achievements.length}</strong></div>
      {achievements.map((item) => <div key={item.title} className={styles.achievement} data-earned={item.earned}><span aria-hidden="true">{item.icon}</span><div><strong>{item.title}</strong><small>{item.detail} {item.earned ? "Tamamlandı." : "Henüz tamamlanmadı."}</small></div></div>)}
    </section>
    <section className={styles.panel}><h2>✨ Özel meydan okumalar</h2><p>Risk, Çarpan Merdiveni ve Bomba Kart seni bekliyor.</p><p style={{ marginTop: 18 }}><Link className={styles.button} href="/challenges">Modları keşfet →</Link></p></section>
  </ArcadeShell>;
}
