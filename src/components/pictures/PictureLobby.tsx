"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { GAME_CONSTANTS } from "@/features/game/contracts";
import { PICTURE_BOARDS, pictureHref } from "@/features/game/pictures";
import {
  emptyPictureSnapshot,
  pictureProgressSnapshot,
  subscribePictures,
  type PictureBoardProgress,
} from "@/lib/persistence/pictureProgress";

import styles from "./Pictures.module.css";

function statusLabel(progress: PictureBoardProgress | undefined): string {
  switch (progress?.status) {
    case "won":
      return `Tamamlandı · ${progress.mistakesUsed} hata`;
    case "lost":
      return `Bitti · ${progress.solvedGroups}/${GAME_CONSTANTS.groupCount} grup`;
    case "playing":
      return `Devam et · ${progress.solvedGroups}/${GAME_CONSTANTS.groupCount} grup`;
    default:
      return "Yeni";
  }
}

export function PictureLobby() {
  const raw = useSyncExternalStore(subscribePictures, pictureProgressSnapshot, emptyPictureSnapshot);
  const progress: PictureBoardProgress[] = raw ? JSON.parse(raw) : [];

  return (
    <section className={styles.lobby} aria-labelledby="pictures-title">
      <p><Link href="/">← Ana sayfa</Link></p>
      <span className={styles.kicker}>YENİ OYUN MODU</span>
      <h1 id="pictures-title">Resimli Quadro</h1>
      <p className={styles.lead}>
        On altı çizimin içinde dört gizli bağ var. Ortak bağı olan dört görseli seç, Grupla&apos;ya bas.
        Bağ nesnenin adında, işinde ya da ortak bir özelliğinde olabilir. {GAME_CONSTANTS.maxMistakes} hata hakkın var.
      </p>
      <ul className={styles.boards}>
        {PICTURE_BOARDS.map(({ board, label, note }) => (
          <li key={board}>
            <Link className={styles.board} href={pictureHref(board)}>
              <strong>Tahta {board} · {label}</strong>
              <span>{note}</span>
              <em>{statusLabel(progress[board - 1])}</em>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
