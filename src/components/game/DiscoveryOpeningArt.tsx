import type { CSSProperties } from "react";
import styles from "./DiscoveryOpeningArt.module.css";

export function ChefScene() {
  return <div className={`${styles.scene} ${styles.kitchen}`} aria-hidden="true">
    <div className={styles.tiles} /><div className={styles.kitchenSign}>ATELIER <b>QUADRO</b><small>BUGÜNÜN TARİFİ: KEŞİF</small></div>
    <div className={styles.panRail}>{[0, 1, 2].map(i => <i key={i} />)}</div>
    <div className={styles.chef}><div className={styles.hat}><i /><i /><i /></div><div className={styles.face}><i /><i /><b /></div><div className={styles.coat}><i /><i /><i /><span /></div><div className={styles.arm}><i /><b /></div></div>
    <div className={styles.counter}><div className={styles.board}><i className={styles.onion} />{Array.from({ length: 7 }, (_, i) => <span key={i} className={styles.onionSlice} style={{ "--slice": i } as CSSProperties} />)}</div><div className={styles.pot}><span /><i /><i /><i /></div><div className={styles.herbs}><i /><i /><i /></div></div>
    <div className={styles.recipe}>16 MALZEME <i /> 4 GİZLİ TARİF</div>
  </div>;
}

export function DetectiveScene() {
  return <div className={`${styles.scene} ${styles.desk}`} aria-hidden="true">
    <div className={styles.deskMat} /><div className={styles.deskLabel}>QUADRO / ARAŞTIRMA BÜROSU <span>DOSYA NO. 016</span></div>
    <div className={styles.folder}><span>GÜNLÜK DOSYA</span><div className={styles.paper}><small>GÖZLEM NOTLARI</small><b>Görünenden<br />fazlası var.</b><i /><i /><i /><div className={styles.fingerprint} /></div></div>
    <div className={styles.evidence}>{["01", "02", "03"].map((n, i) => <span key={n} style={{ "--note": i } as CSSProperties}><small>{n} / BULGU</small><b>Q</b><i /></span>)}</div>
    <div className={styles.pencil} /><div className={styles.cup}><i /></div><div className={styles.loupe}><div /><span /></div><div className={styles.stamp}>İNCELENDİ <small>QUADRO ARŞİVİ</small></div>
    <div className={styles.deskFooter}>DİKKATLİ BAK. BAĞI KEŞFET.</div>
  </div>;
}

export function GameShowScene() {
  return <div className={`${styles.scene} ${styles.show}`} aria-hidden="true">
    <div className={styles.showLines} /><div className={styles.showBeam} /><div className={`${styles.showBeam} ${styles.showBeamRight}`} />
    <div className={styles.showBrand}>QUADRO <span>BU SAHNE SENİN</span></div><div className={styles.arch}><i /><i /><i /></div>
    <div className={styles.countdown}>{[3, 2, 1].map((n, i) => <span key={n} style={{ "--count": i } as CSSProperties}>{n}</span>)}<b>BAŞLA</b></div>
    <div className={styles.podiums}>{[0, 1, 2, 3].map(i => <div key={i} style={{ "--podium": i } as CSSProperties}><i /><span>Q</span><small>{String(i + 1).padStart(2, "0")}</small></div>)}</div>
    <div className={styles.showFloor} /><div className={styles.showCaption}>16 KELİME <i /> TEK BÜYÜK KEŞİF</div>
  </div>;
}
