"use client";

import Link from "next/link";
import Image from "next/image";
import { useSyncExternalStore } from "react";
import { GAME_CONSTANTS } from "@/features/game/contracts";
import { PICTURE_BOARDS, pictureHref } from "@/features/game/pictures";
import { emptyPictureSnapshot, pictureProgressSnapshot, subscribePictures, type PictureBoardProgress } from "@/lib/persistence/pictureProgress";
import { ArcadeShell, ArcadeTitle } from "@/components/arcade/ArcadeShell";
import styles from "@/components/arcade/ArcadeHub.module.css";

function statusLabel(progress: PictureBoardProgress | undefined): string {
  switch (progress?.status) {
    case "won": return `Tamamlandı · ${progress.mistakesUsed} hata`;
    case "lost": return `Bitti · ${progress.solvedGroups}/${GAME_CONSTANTS.groupCount} grup`;
    case "playing": return `Devam et · ${progress.solvedGroups}/${GAME_CONSTANTS.groupCount} grup`;
    default: return "Yeni · Keşfetmeye başla →";
  }
}

export function PictureLobby() {
  const raw = useSyncExternalStore(subscribePictures, pictureProgressSnapshot, emptyPictureSnapshot);
  const progress: PictureBoardProgress[] = raw ? JSON.parse(raw) : [];
  const complete = progress.filter((item) => item?.status === "won").length;
  return <ArcadeShell active="play">
    <ArcadeTitle eyebrow="GÖRSELLERİN DÜNYASI" title="Resimli Quadro" description="Görsellerden yola çıkarak kelimelerin bağını bul!" />
    <section className={`${styles.panel} ${styles.withArt}`} aria-labelledby="pictures-title">
      <Image className={styles.heroArt} src="/images/pictures/mode-entry.svg" width={200} height={200} alt="" unoptimized />
      <span className={styles.eyebrow}>KOLEKSİYONUM</span><h2 id="pictures-title">Resimli Quadro albümün</h2>
      <p>On altı görselin içindeki dört gizli bağı bul. {GAME_CONSTANTS.maxMistakes} hata hakkın var.</p>
      <div className={styles.bar}><span style={{width: `${complete / PICTURE_BOARDS.length * 100}%`}} /></div>
      <p>{raw ? `${complete} / ${PICTURE_BOARDS.length} tahta tamamlandı` : "İlerlemen yükleniyor…"}</p>
    </section>
    <section className={styles.panel}>
      <span className={styles.eyebrow}>✦ SIRADAKİ KEŞİF</span><h2>Görsellere yakından bak</h2>
      <p>Ortak bağ bir nesnenin adında, işinde ya da özelliğinde saklı olabilir.</p>
      <p style={{marginTop: 18}}><a className={styles.button} href="#tahtalar">▶ Tahtaları Keşfet</a></p>
    </section>
    <h2 id="tahtalar" className={styles.sectionTitle}>▧ Tahtalarım</h2>
    <div className={styles.grid3}>{PICTURE_BOARDS.map(({ board, label, note }) => <Link key={board} href={pictureHref(board)} className={styles.card}>
      <span className={styles.cardIcon} aria-hidden="true">{["🌿", "🏙️", "✨"][board - 1]}</span>
      <strong>Tahta {board} · {label}</strong><small>{note}</small><em>{statusLabel(progress[board - 1])}</em>
    </Link>)}</div>
  </ArcadeShell>;
}



