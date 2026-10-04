import type { CSSProperties } from "react";
import styles from "./TravelOpeningArt.module.css";

export function DominoScene() {
  return <div className={`${styles.scene} ${styles.dominoSet}`} aria-hidden="true">
    <div className={styles.tableLine} />
    <div className={styles.inscription}><span>Q / 016</span><b>THE CONNECTION CLUB</b><span>EST. MMXXVI</span></div>
    <div className={styles.dominoTrack}>
      {Array.from({ length: 16 }, (_, i) => <div key={i} className={styles.domino} style={{ "--index": i, "--fall-delay": `${660 + i * 72}ms` } as CSSProperties}>
        <div className={styles.dominoFace}><span><i /><i /><i /></span><hr /><span><i /><i /></span></div>
      </div>)}
    </div>
    <div className={styles.tableCaption}>BİR HAREKETLE BAŞLAR <span>↗</span></div>
  </div>;
}

export function ElevatorScene() {
  return <div className={`${styles.scene} ${styles.elevatorSet}`} aria-hidden="true">
    <div className={styles.wallLight} /><div className={`${styles.wallLight} ${styles.rightLight}`} />
    <div className={styles.hotelMark}>Q<small>GRAND HOTEL</small></div>
    <div className={styles.liftFrame}>
      <div className={styles.floorDisplay}><span>↑</span><div><b>01</b><b>02</b><b>03</b></div></div>
      <div className={styles.liftCabin}><div className={styles.cabinGlow} /><span>HER KATTA<br />YENİ BİR BAĞ.</span></div>
      <div className={styles.liftDoors}><div className={styles.liftLeft} /><div className={styles.liftRight} /></div>
      <div className={styles.liftSill} />
    </div>
    <div className={styles.liftButtons}><i>↑</i><i>↓</i><small>16 / 04</small></div>
    <div className={styles.marbleFloor} />
  </div>;
}

export function BaggageScene() {
  return <div className={`${styles.scene} ${styles.airportSet}`} aria-hidden="true">
    <div className={styles.airportWindows}><i /><i /><i /><i /><i /></div>
    <div className={styles.flightSign}><span>↘</span><div>BAGAJ TESLİM<small>QUADRO INTERNATIONAL</small></div><b>04</b></div>
    <div className={styles.belt}><div className={styles.beltRollers} /><div className={styles.beltCenter}>Q / ARRIVALS</div></div>
    <div className={styles.bags}>
      {Array.from({ length: 6 }, (_, i) => <div key={i} className={styles.suitcase} style={{ "--bag": i, "--case-color": ["#b8754e", "#41685d", "#c2ae79", "#48576d", "#944e44", "#79846c"][i] } as CSSProperties}>
        <i className={styles.handle} /><span className={styles.caseRibs} /><i className={styles.tag}>{String(i + 1).padStart(2, "0")}</i><i className={styles.wheel} />
      </div>)}
    </div>
    <div className={styles.scanner}><span /><i /></div>
    <div className={styles.airportCaption}>SONRAKİ DURAK: KEŞİF <span>→</span></div>
  </div>;
}
