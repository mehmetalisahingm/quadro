import type { CSSProperties } from "react";
import styles from "./ShowtimeOpeningArt.module.css";

export function ClawScene() {
  return <div className={`${styles.scene} ${styles.arcade}`} aria-hidden="true">
    <div className={styles.arcadeSide}>Q<small>PLAY / DISCOVER</small></div>
    <div className={styles.cabinet}>
      <div className={styles.marquee}><i />QUADRO CLUB<i /></div>
      <div className={styles.glass}>
        <div className={styles.rail} />
        <div className={styles.carriage}><div className={styles.cable} /><div className={styles.claw}><b /><i /><i /><span /></div></div>
        <div className={styles.prizeBed}>
          {Array.from({ length: 12 }, (_, i) => <span key={i} style={{ "--prize-x": i % 6, "--prize-y": Math.floor(i / 6), "--tilt": `${(i % 3 - 1) * 12}deg` } as CSSProperties}><i />Q</span>)}
        </div>
        <div className={styles.glassShine} />
      </div>
      <div className={styles.console}><span className={styles.joystick} /><i /><div className={styles.winLight}>BAĞ YAKALANDI</div><b>16 / 04</b></div>
      <div className={styles.delivery}><span>KEŞFET ↗</span></div>
    </div>
    <div className={styles.arcadeCaption}>HER KART BİR OLASILIK.</div>
  </div>;
}

export function NewsroomScene() {
  return <div className={`${styles.scene} ${styles.newsroom}`} aria-hidden="true">
    <div className={styles.studioGrid} />
    <div className={styles.live}><i /> CANLI <span>Q / 24</span></div>
    <div className={styles.worldScreen}>
      <div className={styles.globe}><i /><i /><i /><span /><span /></div>
      <div className={styles.orbitLine} />
      <div className={styles.bulletin}><small>GÜNÜN BULMACASI</small><b>16 KELİME.<br />4 GİZLİ BAĞ.</b></div>
    </div>
    <div className={styles.studioDesk}><span>QUADRO HABER</span><i /></div>
    <div className={styles.camera}><span /><i /><b /></div>
    <div className={styles.breaking}>SON DAKİKA<span>BAĞLANTILAR SENİ BEKLİYOR</span></div>
    <div className={styles.ticker}><b>Q</b><div><span>GÜNÜN KEŞFİ · ON ALTI KELİME · DÖRT GİZLİ BAĞ · SAHNE SENİN · </span></div><small>16:04</small></div>
  </div>;
}

export function RedCarpetScene() {
  return <div className={`${styles.scene} ${styles.gala}`} aria-hidden="true">
    <div className={styles.galaWall}>{Array.from({ length: 12 }, (_, i) => <span key={i}>Q<small>QUADRO PREMIERE</small></span>)}</div>
    <div className={styles.galaBeam} /><div className={`${styles.galaBeam} ${styles.galaBeamRight}`} />
    <div className={styles.carpet}><span>Q</span></div>
    {[0, 1].map((side) => <div key={side} className={`${styles.ropes} ${side ? styles.ropesRight : ""}`}>
      {[0, 1, 2].map((i) => <div key={i} className={styles.stanchion} style={{ "--post": i } as CSSProperties}><b /><span /><i /></div>)}
      <div className={styles.velvetRope} />
    </div>)}
    <div className={styles.paparazzi}><span><i /></span><span><i /></span><span><i /></span></div>
    <div className={`${styles.paparazzi} ${styles.paparazziRight}`}><span><i /></span><span><i /></span></div>
    <div className={styles.cameraGlow} /><div className={`${styles.cameraGlow} ${styles.cameraGlowRight}`} />
    <div className={styles.galaTitle}>GALA GECESİ <span>DAVETLİ: SEN</span></div>
  </div>;
}
