import { useId } from "react";
import styles from "./StoryOpening.module.css";

export function MetroScene() {
  const id = useId().replace(/:/g, "");
  return (
    <div className={styles.scenery} aria-hidden="true">
      <div className={styles.stationWall} />
      <div className={styles.stationSign}><b>Q</b><span>BAĞLANTI İSTASYONU<small>HAT 04 · PERON 16</small></span><i>→</i></div>
      <div className={styles.stationClock}><i /></div>
      <div className={styles.track}><span /><span /></div>
      <div className={styles.train}>
        <svg viewBox="0 0 1000 220" preserveAspectRatio="none" fill="none">
          <defs>
            <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f7f3e8" /><stop offset=".35" stopColor="#dedfd4" /><stop offset=".78" stopColor="#b0bfb3" /><stop offset="1" stopColor="#6d887b" /></linearGradient>
            <linearGradient id={`${id}-window`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#203e39" /><stop offset=".5" stopColor="#4b6c5e" /><stop offset="1" stopColor="#1f3933" /></linearGradient>
            <linearGradient id={`${id}-shine`}><stop stopColor="#f7f2d6" stopOpacity="0" /><stop offset=".5" stopColor="#fff9e7" stopOpacity=".32" /><stop offset="1" stopColor="#f7f2d6" stopOpacity="0" /></linearGradient>
            {[140, 452, 764].map((x, i) => <clipPath id={`${id}-door-${i}`} key={x}><rect x={x} y="37" width="86" height="130" rx="5" /></clipPath>)}
          </defs>
          <ellipse cx="500" cy="202" rx="475" ry="12" fill="#17382e" opacity=".2" />
          {[100, 280, 425, 595, 745, 920].map((x) => <g key={x}><circle cx={x} cy="180" r="18" fill="#263b34" /><circle cx={x} cy="180" r="9" fill="#879489" /><circle cx={x} cy="180" r="3" fill="#34493d" /></g>)}
          <path d="M17 172V56Q17 18 57 18H935Q983 18 983 69V172Q983 180 974 180H28Q17 180 17 172Z" fill={`url(#${id}-body)`} stroke="#6e8173" strokeWidth="2" />
          <path d="M25 43H971M24 169H975" stroke="#faf5e8" opacity=".75" />
          <path d="M19 128H981V140H19Z" fill="#bd673a" />
          <path d="M20 141H980V144H20Z" fill="#f4d295" />
          {[42, 249, 350, 561, 662, 873].map((x) => <g key={x}><rect x={x} y="44" width="78" height="65" rx="9" fill={`url(#${id}-window)`} stroke="#87988a" strokeWidth="2" /><path d={`M${x+9} 48h52l-28 56H${x+9}Z`} fill="#eee8bf" opacity=".09" /><path d={`M${x+8} 97h61`} stroke="#84907a" opacity=".45" /></g>)}
          {[140, 452, 764].map((x, i) => <g key={x}>
            <rect x={x-2} y="35" width="90" height="134" rx="6" fill="#718476" />
            <rect x={x} y="37" width="86" height="130" rx="5" fill="#182e28" />
            <g clipPath={`url(#${id}-door-${i})`}>
              <g className={styles.doorLeft}><rect x={x} y="37" width="43" height="130" fill="#cbd1c3" /><rect x={x+7} y="47" width="29" height="62" rx="5" fill={`url(#${id}-window)`} /><path d={`M${x} 128h43v12h-43Z`} fill="#bd673a" /><path d={`M${x+39} 112v12`} stroke="#596f60" strokeWidth="2" /></g>
              <g className={styles.doorRight}><rect x={x+43} y="37" width="43" height="130" fill="#d6d9cb" /><rect x={x+50} y="47" width="29" height="62" rx="5" fill={`url(#${id}-window)`} /><path d={`M${x+43} 128h43v12h-43Z`} fill="#bd673a" /><path d={`M${x+47} 112v12`} stroke="#596f60" strokeWidth="2" /></g>
            </g>
            <circle cx={x+43} cy="29" r="3" fill="#e5af57" />
          </g>)}
          <path d="M326 22v152M640 22v152" stroke="#738578" strokeWidth="4" strokeDasharray="2 2" />
          <path d="M43 25H946" stroke="#fffbed" strokeWidth="2" />
          <rect x="27" y="119" width="8" height="10" rx="3" fill="#ecb454" /><rect x="966" y="119" width="8" height="10" rx="3" fill="#fff1b9" />
          <text x="75" y="161" fill="#546f5c" fontSize="9" letterSpacing="3">QUADRO</text>
          <path d="M20 20H980V125H20Z" fill={`url(#${id}-shine)`} />
        </svg>
      </div>
      <div className={styles.platformEdge} />
      <div className={styles.platformNumber}>04<span>BAĞLANTI HATTI</span></div>
    </div>
  );
}

export function FilmScene() {
  return (
    <div className={`${styles.scenery} ${styles.filmSet}`} aria-hidden="true">
      <div className={`${styles.spotlight} ${styles.spotlightLeft}`} /><div className={`${styles.spotlight} ${styles.spotlightRight}`} />
      <div className={styles.lampLeft}><i /></div><div className={styles.lampRight}><i /></div>
      <div className={`${styles.curtain} ${styles.curtainLeft}`} /><div className={`${styles.curtain} ${styles.curtainRight}`} />
      <div className={styles.stageFloor} />
      <div className={styles.clapper}>
        <div className={styles.clapperArm}><span /><i /></div>
        <div className={styles.clapperBody}>
          <span className={styles.production}>QUADRO PICTURES</span>
          <strong>Bir bağ kur.</strong>
          <div className={styles.slateNumbers}><span>SAHNE<b>16</b></span><span>PLAN<b>04</b></span><span>TEKRAR<b>01</b></span></div>
          <div className={styles.slateFooter}><span>YÖNETMEN <b>SEN</b></span><i /> KAYIT</div>
        </div>
      </div>
      <div className={styles.action}>MOTOR. <em>KAYIT.</em></div>
      <div className={styles.frameCorner} /><div className={styles.frameCornerBottom} />
    </div>
  );
}

export function RecordScene() {
  return (
    <div className={`${styles.scenery} ${styles.recordSet}`} aria-hidden="true">
      <div className={styles.recordGlow} />
      <div className={styles.recordSleeve}><span>QUADRO</span><strong>BAĞLANTI<br />ARŞİVİ</strong><i>16 / 04 · SIDE A</i></div>
      <div className={styles.vinyl}><div className={styles.vinylLabel}>Q</div><div className={styles.vinylHole} /></div>
      <div className={styles.tonearm}><i /><span /></div>
      <div className={styles.recordNeedle}>PLAY</div>
      <div className={styles.recordCaption}>İĞNE İNER · RİTİM BAŞLAR</div>
    </div>
  );
}
