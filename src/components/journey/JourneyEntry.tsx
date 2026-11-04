import Link from "next/link";
import styles from "./JourneyEntry.module.css";
export function JourneyEntry() {
  return <section className={styles.entry} aria-label="Keşif Yolu oyun modu">
    <div className={styles.miniMap} aria-hidden="true"><i>1</i><span /><i>2</i><span /><i>✧</i></div>
    <div><span className={styles.kicker}>YENİ OYUN MODU · 200 ADIM</span><h2>Keşif Yolu</h2><p>Kolaydan başla. Bağları öğren, yıldızları topla ve yeni adımları aç.</p></div>
    <Link href="/journey" className={styles.link}>Yolculuğa çık ↗</Link>
  </section>;
}
