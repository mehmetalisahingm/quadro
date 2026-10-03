import type { CSSProperties } from "react";
import styles from "./FinalOpeningArt.module.css";

export function SunriseScene() {
  return <div className={`${styles.scene} ${styles.dawn}`} aria-hidden="true">
    <div className={styles.dawnLight} /><div className={styles.dawnSun} /><div className={styles.dawnRays} />
    <div className={styles.farMountains} /><div className={styles.nearMountains} />
    <div className={styles.lake}><i /><i /><i /><span /></div><div className={styles.shore} />
    <div className={styles.reeds}><i /><i /><i /><i /></div><div className={styles.birds}><i /><i /><i /></div>
    <div className={styles.caption}>QUADRO / SABAH <span>YENİ BİR BAŞLANGIÇ</span></div>
  </div>;
}

export function SunsetScene() {
  return <div className={`${styles.scene} ${styles.dusk}`} aria-hidden="true">
    <div className={styles.duskGlow} /><div className={styles.duskSun} /><div className={styles.clouds}><i /><i /></div>
    <div className={styles.sea}><i /><i /><i /><i /><span /></div><div className={styles.island} />
    <div className={styles.sailboat}><i /><b /><span /></div><div className={styles.duskCoast} /><div className={styles.lighthouse}><i /><b /><span /></div>
    <div className={styles.eveningStar} /><div className={styles.caption}>QUADRO / AKŞAM <span>GÜNÜN SON KEŞFİ</span></div>
  </div>;
}

export function SnowScene() {
  return <div className={`${styles.scene} ${styles.winter}`} aria-hidden="true">
    <div className={styles.winterMoon} /><div className={styles.snowMountain} /><div className={styles.snowMountainNear} />
    <div className={styles.snowGround} /><div className={styles.forest}>{Array.from({length:7},(_,i)=><span key={i} style={{"--tree":i,"--height":`${38+(i*19)%37}%`} as CSSProperties}><i /><b /></span>)}</div>
    <div className={styles.cabin}><i /><b /><span /><div /></div><div className={styles.path} />
    <div className={styles.snowflakes}>{Array.from({length:24},(_,i)=><i key={i} style={{"--x":`${(i*43)%100}%`,"--delay":`${-(i%9)*.3}s`,"--size":`${2+i%3}px`,"--fall":`${2+i%4*.35}s`} as CSSProperties} />)}</div>
    <div className={styles.caption}>QUADRO / KIŞ <span>SESSİZLİĞİN İÇİNDE BİR BAĞ</span></div>
  </div>;
}

export function RacingScene() {
  return <div className={`${styles.scene} ${styles.circuit}`} aria-hidden="true">
    <div className={styles.grandstand} /><div className={styles.track}><i /><i /><i /></div>
    <div className={styles.pitWall}><span>QUADRO GRAND PRIX</span><b>16 / 04</b></div><div className={styles.finishLine} />
    {[0,1,2].map(i=><div key={i} className={styles.raceCar} data-race-car style={{"--lane":i} as CSSProperties}><i /><b /><span /><em>Q</em><div /></div>)}
    <div className={styles.speedLines}><i /><i /><i /></div><div className={styles.raceBadge}>Q<small>GRAND PRIX</small></div>
    <div className={styles.caption}>QUADRO / YARIŞ GÜNÜ <span>BAĞLANTILAR HIZ KAZANIYOR</span></div>
  </div>;
}
