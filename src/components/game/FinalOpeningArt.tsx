import { useId, type CSSProperties } from "react";
import styles from "./FinalOpeningArt.module.css";

const ATMOSPHERES = {
  sunrise: { name: "SABAH", detail: "IŞIĞIN İLK İZİ", position: "50% 55%" },
  sunset: { name: "AKŞAM", detail: "GÜNÜN SON KEŞFİ", position: "58% 55%" },
  snow: { name: "KIŞ", detail: "SESSİZLİĞİN İÇİNDE", position: "50% 60%" },
} as const;

function Atmosphere({ theme }: { theme: keyof typeof ATMOSPHERES }) {
  const scene = ATMOSPHERES[theme];
  return <div className={`${styles.scene} ${styles[theme]}`} data-atmosphere={theme} aria-hidden="true">
    <link rel="preload" as="image" href={`/images/openings/${theme}-premium.webp`} />
    <div className={styles.landscape} style={{ backgroundImage: `url(/images/openings/${theme}-premium.webp)`, "--landscape-position": scene.position } as CSSProperties} />
    <div className={styles.exposure} /><div className={styles.light} /><div className={styles.mist} />
    {theme === "snow" && <div className={styles.snowflakes}>{Array.from({ length: 26 }, (_, i) => <i key={i} style={{ "--x": `${i * 43 % 100}%`, "--delay": `${-(i % 9) * .3}s`, "--size": `${2 + i % 4}px`, "--fall": `${2.3 + i % 4 * .4}s` } as CSSProperties} />)}</div>}
    <div className={styles.caption}><span>Q <i /> {scene.name}</span><small>{scene.detail}</small></div>
    <div className={styles.edition}><i /> QUADRO / LANDSCAPES</div>
  </div>;
}

export function SunriseScene() { return <Atmosphere theme="sunrise" />; }
export function SunsetScene() { return <Atmosphere theme="sunset" />; }
export function SnowScene() { return <Atmosphere theme="snow" />; }

function RaceCar({ paint, id }: { paint: string; id: string }) {
  return <g>
    <ellipse cx="116" cy="73" rx="106" ry="33" fill="#061419" opacity=".45" />
    <g fill={`url(#${id}-tire)`} stroke="#718281" strokeWidth="1"><rect x="31" y="7" width="35" height="19" rx="6" /><rect x="31" y="81" width="35" height="19" rx="6" /><rect x="150" y="7" width="34" height="19" rx="6" /><rect x="150" y="81" width="34" height="19" rx="6" /></g>
    <path d="M20 34Q42 18 78 21L149 24Q192 25 211 44L215 55Q210 77 176 82L63 87Q31 89 17 70Z" fill={paint} stroke="#e4e4c0" strokeOpacity=".7" strokeWidth="1.3" />
    <path d="M24 39Q91 22 175 34L201 44Q101 34 23 48Z" fill="#fff7d6" opacity=".42" />
    <path d="M22 72Q92 77 203 65L194 77Q89 94 24 80Z" fill="#0c272b" opacity=".35" />
    <path d="M83 26L126 29Q146 38 149 53Q146 68 128 79L81 83Q96 56 83 26Z" fill={`url(#${id}-glass)`} stroke="#cad9cc" strokeWidth="2" />
    <path d="M96 31L121 33Q132 42 133 52L103 52Z" fill="#aecad0" opacity=".35" />
    <path d="M102 58L134 57L124 74L93 77Z" fill="#577b83" opacity=".7" />
    <path d="M74 25L80 84M151 29L155 80" stroke="#fff5d0" strokeOpacity=".45" />
    <path d="M25 30L22 80M193 35L193 74" stroke="#244748" strokeWidth="3" />
    <rect x="12" y="18" width="12" height="75" rx="3" fill={`url(#${id}-metal)`} stroke="#c8c6ab" />
    <path d="M16 22V88M202 48L207 53L203 67" fill="none" stroke="#e6e9d7" strokeWidth="2" />
    <path d="M191 35L199 40M190 77L199 73" stroke="#fffbd4" strokeWidth="5" strokeLinecap="round" />
    <path d="M28 35L36 35M28 76L36 76" stroke="#e39162" strokeWidth="4" />
    <circle cx="170" cy="54" r="12" fill="#f4ead0" opacity=".9" /><text x="170" y="59" textAnchor="middle" fontFamily="Georgia" fontSize="14" fill="#365452">Q</text>
    <path d="M48 26L58 24M49 84L61 86" stroke="#f2e6c5" strokeWidth="2" /><path d="M62 36L76 35M61 41L77 40M62 69L76 69M61 74L77 74" stroke="#2e5151" strokeWidth="2" opacity=".6" />
  </g>;
}

export function RacingScene() {
  const id = useId().replace(/:/g, "");
  return <div className={`${styles.scene} ${styles.circuit}`} aria-hidden="true">
    <svg className={styles.trackArt} viewBox="0 0 1000 540" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`${id}-asphalt`} x2=".4" y2="1"><stop stopColor="#3f5357" /><stop offset="1" stopColor="#172e35" /></linearGradient>
        <linearGradient id={`${id}-grass`} x2="1" y2="1"><stop stopColor="#648171" /><stop offset="1" stopColor="#244d42" /></linearGradient>
        <linearGradient id={`${id}-gold`} x2=".2" y2="1"><stop stopColor="#f5e8ba" /><stop offset=".35" stopColor="#c5a16b" /><stop offset=".6" stopColor="#f3ddb0" /><stop offset="1" stopColor="#8d754b" /></linearGradient>
        <linearGradient id={`${id}-green`} x2=".2" y2="1"><stop stopColor="#bed9c3" /><stop offset=".35" stopColor="#367769" /><stop offset=".6" stopColor="#86b29b" /><stop offset="1" stopColor="#285c50" /></linearGradient>
        <linearGradient id={`${id}-silver`} x2=".2" y2="1"><stop stopColor="#e9efec" /><stop offset=".4" stopColor="#8a9eac" /><stop offset=".65" stopColor="#cbd7da" /><stop offset="1" stopColor="#607782" /></linearGradient>
        <linearGradient id={`${id}-glass`} x2="1" y2="1"><stop stopColor="#102d38" /><stop offset=".5" stopColor="#466a7c" /><stop offset="1" stopColor="#10232b" /></linearGradient>
        <linearGradient id={`${id}-tire`} x2="0" y2="1"><stop stopColor="#13252a" /><stop offset=".45" stopColor="#374449" /><stop offset="1" stopColor="#0a1c23" /></linearGradient>
        <linearGradient id={`${id}-metal`} x2="1" y2="0"><stop stopColor="#849b97" /><stop offset=".4" stopColor="#e7e4c8" /><stop offset="1" stopColor="#3a5a59" /></linearGradient>
        <pattern id={`${id}-grain`} width="7" height="9" patternUnits="userSpaceOnUse"><circle cx="1" cy="2" r=".6" fill="#b9cac2" opacity=".12" /><circle cx="5" cy="6" r=".6" fill="#03151c" opacity=".2" /></pattern>
        <pattern id={`${id}-checks`} width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#dadbc4" /><path d="M0 0H12V12H0ZM12 12H24V24H12Z" fill="#27454b" /></pattern>
      </defs>
      <rect width="1000" height="540" fill={`url(#${id}-grass)`} />
      <path d="M0 500Q370 450 1000 450M0 520Q350 470 1000 470" fill="none" stroke="#e3d7a9" strokeOpacity=".15" />
      <g transform="rotate(-12 500 270)">
        <rect x="-150" y="110" width="1350" height="331" rx="8" fill="#091e27" opacity=".2" />
        <rect x="-150" y="91" width="1350" height="329" fill={`url(#${id}-asphalt)`} />
        <rect x="-150" y="91" width="1350" height="329" fill={`url(#${id}-grain)`} />
        <path d="M-150 89H1200M-150 423H1200" stroke="#e3dbc2" strokeWidth="16" /><path d="M-150 89H1200M-150 423H1200" stroke="#b45e4d" strokeWidth="16" strokeDasharray="35 35" />
        <path d="M-150 106H1200M-150 407H1200" stroke="#d9d7ba" strokeWidth="2" />
        <path d="M-150 205H1200M-150 305H1200" stroke="#d0d2bf" strokeWidth="2" strokeDasharray="35 45" opacity=".35" />
        <path d="M180 147Q400 155 635 133M180 160Q400 170 635 146M175 344Q345 358 610 350" stroke="#081f28" strokeWidth="3" fill="none" opacity=".35" />
        <rect x="790" y="107" width="48" height="298" fill={`url(#${id}-checks)`} opacity=".85" />
        <g fill="none" stroke="#eee4bf" opacity=".2">{Array.from({length:6},(_,i)=><path key={i} d={`M${110+i*110} 193v-21h48v21M${165+i*110} 393v-21h48v21`} />)}</g>
        <g transform="translate(0 110)"><g className={`${styles.carRun} ${styles.carOne}`} data-race-car><RaceCar id={id} paint={`url(#${id}-gold)`} /></g></g>
        <g transform="translate(0 212)"><g className={`${styles.carRun} ${styles.carTwo}`} data-race-car><RaceCar id={id} paint={`url(#${id}-green)`} /></g></g>
        <g transform="translate(0 315)"><g className={`${styles.carRun} ${styles.carThree}`} data-race-car><RaceCar id={id} paint={`url(#${id}-silver)`} /></g></g>
        <g transform="translate(110 27)"><rect x="8" y="10" width="540" height="51" rx="2" fill="#132c30" opacity=".45" /><rect width="540" height="48" rx="2" fill="#23483f" stroke="#bdb388" /><text x="25" y="31" fill="#e4d6aa" fontSize="19" fontFamily="Georgia" letterSpacing="4">QUADRO GRAND PRIX</text><text x="475" y="30" fill="#d7c794" fontSize="12" fontFamily="monospace">16/04</text></g>
      </g>
      <path d="M0 48L200 7H660L755 48Z" fill="#2c514c" /><path d="M0 48H755L735 63H0Z" fill="#153b38" />
      <g stroke="#83978a" opacity=".6">{Array.from({length:18},(_,i)=><path key={i} d={`M${i*43} 50l20 -37`} />)}</g>
      <path d="M865 0V90M940 0V80" stroke="#bbcab9" strokeWidth="3" opacity=".5" /><path d="M800 54L1000 12" stroke="#c5ccbb" strokeWidth="4" opacity=".6" />
    </svg>
    <div className={styles.raceSheen} /><div className={styles.caption}><span>Q <i /> GRAND PRIX</span><small>LA DERNIÈRE LIGNE DROITE</small></div><div className={styles.edition}><i /> QUADRO / MOTORSPORT</div>
  </div>;
}
