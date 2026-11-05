import Image from "next/image";
import Link from "next/link";

import { PICTURE_BOARD_COUNT } from "@/features/game/pictures";

import styles from "./Pictures.module.css";

export function PictureEntry() {
  return (
    <section className={styles.entry} aria-label="Resimli Quadro oyun modu">
      <div className={styles.entryArt} aria-hidden="true">
        <Image src="/images/pictures/mode-entry.svg" alt="" width={200} height={200} unoptimized />
      </div>
      <div>
        <span className={styles.kicker}>YENİ OYUN MODU · {PICTURE_BOARD_COUNT} TAHTA</span>
        <h2>Resimli Quadro</h2>
        <p>Kelime yok, on altı çizim var. Aralarındaki dört gizli bağı bul.</p>
      </div>
      <Link href="/pictures" className={styles.entryLink}>Görsellerle oyna ↗</Link>
    </section>
  );
}
