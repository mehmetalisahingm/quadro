"use client";

import { useEffect, useId, useState } from "react";
import styles from "./FootballReaction.module.css";

export type FootballVariant = "flag" | "whistle";

export function FootballArt({ variant = "flag", lost = false, compact = false }: { variant?: FootballVariant; lost?: boolean; compact?: boolean }) {
  const id = useId().replace(/:/g, "");
  const whistle = variant === "whistle";
  return <span className={`${styles.art} ${compact ? styles.compact : ""} ${lost ? styles.lost : ""}`} aria-hidden="true">
    <svg viewBox={compact ? whistle ? "150 95 320 230" : "145 -70 300 435" : "-70 -100 780 490"} preserveAspectRatio={compact ? "xMidYMid meet" : "xMidYMid slice"}>
      <defs>
        <linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor="#183e49" /><stop offset="1" stopColor="#668677" /></linearGradient>
        <linearGradient id={`${id}-grass`} x2=".2" y2="1"><stop stopColor="#71886a" /><stop offset="1" stopColor="#244e43" /></linearGradient>
        <linearGradient id={`${id}-shirt`} x2="1" y2="1"><stop stopColor="#f2dda0" /><stop offset=".45" stopColor="#c8ac5c" /><stop offset="1" stopColor="#a0843c" /></linearGradient>
        <linearGradient id={`${id}-skin`} x2="1" y2=".3"><stop stopColor="#edc79b" /><stop offset="1" stopColor="#b78561" /></linearGradient>
        <linearGradient id={`${id}-shorts`} x2="1" y2="1"><stop stopColor="#344b50" /><stop offset="1" stopColor="#122b36" /></linearGradient>
        <linearGradient id={`${id}-chrome`} x2=".6" y2="1"><stop stopColor="#edf2dc" /><stop offset=".2" stopColor="#9fbcb5" /><stop offset=".45" stopColor="#e4ead5" /><stop offset=".6" stopColor="#5e8280" /><stop offset="1" stopColor="#254b54" /></linearGradient>
        <pattern id={`${id}-seats`} width="12" height="10" patternUnits="userSpaceOnUse"><rect x="2" y="2" width="7" height="5" rx="1" fill="#bac7aa" opacity=".22" /></pattern>
      </defs>
      <g className={styles.stadium}>
        <rect x="-150" y="-100" width="940" height="500" fill={`url(#${id}-sky)`} />
        <path d="M-150 150Q320 15 790 150V245H-150Z" fill="#203f42" /><path d="M-150 150Q320 15 790 150V245H-150Z" fill={`url(#${id}-seats)`} />
        <path d="M-150 142Q320 7 790 142" fill="none" stroke="#a9b9a2" strokeWidth="4" /><path d="M-150 208Q320 117 790 208" fill="none" stroke="#7a9a85" strokeWidth="2" />
        <rect x="-150" y="220" width="940" height="180" fill={`url(#${id}-grass)`} /><path d="M0 260H640M0 325H640" stroke="#99ab7b" strokeWidth="30" opacity=".08" />
        <path d="M-50 355L690 229" stroke="#ede9c8" strokeWidth="7" opacity=".8" /><path d="M385 400L533 232" stroke="#c9d8b2" strokeWidth="3" opacity=".4" />
        <path d="M80 60V210M566 62V212" stroke="#92a799" strokeWidth="3" /><path d="M45 61H116M530 64H602" stroke="#e4ddab" strokeWidth="8" /><path d="M46 62L-10 274H164L113 62ZM532 65L464 274H641L601 65Z" fill="#eee2b3" opacity=".035" />
      </g>
      {!whistle ? <g className={styles.referee}>
        <ellipse cx="275" cy="357" rx="69" ry="12" fill="#102e35" opacity=".4" />
        <path d="M245 249L241 294L226 330L240 337L260 295L265 255M280 251L289 296L291 336L307 336L307 292L300 247" fill={`url(#${id}-skin)`} stroke="#b68b67" strokeWidth="2" />
        <path d="M239 298L227 329L242 337L257 303M289 299L291 337H308L306 298" fill="#213d42" /><path d="M238 302L250 307M291 304H306" stroke="#c8b77e" strokeWidth="3" />
        <path d="M226 325Q216 334 210 340Q207 347 219 349L246 345L246 335Z M291 332L290 347Q305 354 325 350L327 345L307 336Z" fill="#142d35" stroke="#60766d" strokeWidth="1.5" /><path d="M215 346L244 342M294 348H324" stroke="#c1c5a6" strokeWidth="2" />
        <path d="M240 204L233 258L266 264L273 239L283 263L314 258L305 205Z" fill={`url(#${id}-shorts)`} stroke="#304b4d" strokeWidth="2" /><path d="M269 212L273 239M242 229L253 231M291 230L304 227" stroke="#647570" fill="none" />
        <path d="M239 125Q223 130 222 153L212 187L208 214Q210 224 218 220L228 189L242 156" fill={`url(#${id}-skin)`} stroke="#b68b67" strokeWidth="2" />
        <path d="M247 112L230 126L228 152L243 159L242 202Q268 216 305 204L309 151L322 142L311 118L290 109Z" fill={`url(#${id}-shirt)`} stroke="#e2cc8d" strokeWidth="1.3" />
        <path d="M247 115L265 138L284 112M265 138L270 201" fill="none" stroke="#756d41" strokeWidth="2" /><path d="M245 157L261 156L261 169L246 170Z" fill="#d6bd79" stroke="#9e9056" /><path d="M282 144L294 144L294 159L288 163L282 159Z" fill="#e9e2b5" stroke="#a19566" /><path d="M236 145L246 148M306 137L316 132" stroke="#526c57" strokeWidth="3" />
        <path d="M257 94L255 117L266 126L282 113L279 94" fill={`url(#${id}-skin)`} />
        <path d="M246 64Q246 42 268 43Q295 43 294 70L288 98L277 109L259 101L249 84Z" fill={`url(#${id}-skin)`} stroke="#b48a62" strokeWidth="1.3" />
        <path d="M247 73L242 66Q237 42 262 38Q290 33 299 58L292 76L286 58Q267 65 250 57Z" fill="#36423d" /><path d="M252 51Q270 39 287 51" fill="none" stroke="#718072" strokeWidth="2" />
        <path d="M253 75L261 74M277 72L284 73" stroke="#4b5140" strokeWidth="2" /><circle cx="259" cy="78" r="1.5" fill="#263d36" /><circle cx="280" cy="77" r="1.5" fill="#263d36" /><path d="M270 77L269 87L274 87M261 94Q270 98 278 92" stroke="#946d50" strokeWidth="1.5" fill="none" />
        <path d="M292 73L301 73L303 83L294 85" fill="#314e49" /><path d="M297 83L292 94L281 96" stroke="#314e49" strokeWidth="2" fill="none" />
        <g className={styles.flagArm}>
          <path d="M310 131Q327 126 334 146L345 171L350 190L339 196L327 176L315 154" fill={`url(#${id}-skin)`} stroke="#ad825e" strokeWidth="2" /><path d="M311 118L326 125L333 145L316 155L305 135Z" fill={`url(#${id}-shirt)`} stroke="#d9c387" />
          <path d="M335 181L348 176L352 185L338 191Z" fill="#233e43" /><path d="M343 190L349 182Q355 181 358 188L355 203L348 207L341 201Z" fill="#d6ac81" />
          <path d="M351 194L359 282" stroke="#c3ccb7" strokeWidth="4" /><path className={styles.flagCloth} d="M355 225Q376 214 399 225Q420 236 440 222L444 273Q422 287 400 274Q379 263 359 276Z" fill="#edc966" stroke="#f3d782" strokeWidth="1.5" />
          <path className={styles.flagCloth} d="M355 225Q366 219 377 220L379 245Q367 245 357 251ZM399 225Q410 231 420 230L422 257Q412 258 401 252ZM379 245Q389 246 401 252L403 276Q390 269 381 270ZM422 257Q434 256 442 248L444 273Q433 280 424 279Z" fill="#c17443" />
        </g>
      </g> : <g className={styles.whistleDrawing}>
        <ellipse cx="320" cy="288" rx="108" ry="20" fill="#122e34" opacity=".4" />
        <path d="M225 222C143 175 169 120 230 139C270 151 244 199 230 207" fill="none" stroke="#a5b7a6" strokeWidth="6" /><path d="M225 222C143 175 169 120 230 139" fill="none" stroke="#e4e7cb" strokeWidth="2" />
        <path d="M252 160L392 130L417 143L420 176L334 207Q337 262 290 279Q247 287 224 250Q206 215 224 186Z" fill={`url(#${id}-chrome)`} stroke="#becfc1" strokeWidth="2" />
        <ellipse cx="275" cy="225" rx="45" ry="45" fill={`url(#${id}-chrome)`} stroke="#d1dec8" strokeWidth="2" /><ellipse cx="275" cy="225" rx="31" ry="31" fill="#42696b" stroke="#90ada3" strokeWidth="2" /><ellipse cx="275" cy="225" rx="23" ry="23" fill="#345961" /><path d="M259 207Q275 194 291 211" stroke="#82a49b" strokeWidth="3" fill="none" />
        <path d="M286 153L394 130L417 143L309 170Z" fill="#d5e2cc" /><path d="M326 151L364 142L369 158L331 168Z" fill="#284e56" /><path d="M317 181L410 157" stroke="#f5f1d5" strokeWidth="2" opacity=".7" />
        <g className={styles.soundWaves} fill="none" stroke="#e5d5a6" strokeWidth="3" strokeLinecap="round"><path d="M438 129Q454 153 442 177" /><path d="M455 110Q488 153 465 195" /><path d="M474 91Q520 151 489 213" /></g>
      </g>}
    </svg>
    <span className={styles.label}><small>{lost ? "MAÇ SONU" : "QUADRO / KARAR"}</small><b>{lost ? "Son düdük." : whistle ? "Tekrar dene." : "Ofsayt."}</b><i>{lost ? "Yeni bir keşifte görüşürüz." : "Bir sonraki bağ seni bekliyor."}</i></span>
  </span>;
}

/** Presentation only; the game controls and feedback remain independent. */
export function FootballReaction({ variant, lost = false, onComplete }: { variant: FootballVariant; lost?: boolean; onComplete?: () => void }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => { setVisible(false); onComplete?.(); }, 1100);
    return () => window.clearTimeout(timer);
  }, [onComplete]);
  return visible ? <span className={styles.reaction} data-football-reaction={variant}><FootballArt variant={variant} lost={lost} compact /></span> : null;
}
