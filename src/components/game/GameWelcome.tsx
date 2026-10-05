"use client";

import { useId, useState } from "react";
import type { GameDifficulty } from "@/features/game/difficulty";

import styles from "./GameWelcome.module.css";

export type { GameDifficulty } from "@/features/game/difficulty";

export type GameWelcomeProps = {
  onStart: (difficulty: GameDifficulty) => void;
  initialDifficulty?: GameDifficulty;
  rulesOnly?: boolean;
  distinctPuzzles?: boolean;
  onClose?: () => void;
};

const modes = [
  { id: "easy", name: "Kolay", label: "Biraz rehberlik", hint: "4 kategori ipucu", level: 1 },
  { id: "medium", name: "Orta", label: "Tam kararında", hint: "1 kategori ipucu", level: 2 },
  { id: "hard", name: "Zor", label: "Sezgilerine güven", hint: "İpucu yok", level: 3 },
] as const;

const chapters = [
  { id: "basics", label: "Temel kural" },
  { id: "words", label: "Gizli kelimeler" },
  { id: "tricks", label: "Küçük tuzaklar" },
] as const;

type Chapter = (typeof chapters)[number]["id"];

function Arrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GameWelcome({
  distinctPuzzles = false,
  onStart,
  initialDifficulty = "medium",
  rulesOnly = false,
  onClose,
}: GameWelcomeProps) {
  const [difficulty, setDifficulty] = useState<GameDifficulty>(initialDifficulty);
  const [chapter, setChapter] = useState<Chapter>("words");
  const id = useId();

  return (
    <section className={`${styles.welcome} ${rulesOnly ? styles.rulesOnly : ""}`} aria-labelledby={`${id}-title`}>
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}><span aria-hidden="true" /> {rulesOnly ? "Küçük kural kitapçığı" : "Günün küçük keşfi"}</p>
          <h1 id={`${id}-title`} className={styles.title}>
            {rulesOnly ? <>Bağlantıyı <em>yakala.</em></> : <>Her kelimenin bir<br /><em>bağlantısı var.</em></>}
          </h1>
        </div>
        <div className={styles.numbers} aria-label="16 kelime, 4 gizli grup">
          <span><strong>16</strong><small>kelime</small></span>
          <span className={styles.numberConnector} aria-hidden="true">↗</span>
          <span><strong>04</strong><small>gizli bağ</small></span>
        </div>
      </header>

      <p className={styles.intro}>
        Ortak bir bağı olan <strong>4 kelimeyi seç</strong>, <strong>Grupla</strong>’ya bas.
        Dört grubu da bulmak için <strong>4 hata hakkın</strong> var.
      </p>

      <div className={styles.book}>
        <div className={styles.bookHeader}>
          <span className={styles.bookLabel}>OYUNDAN ÖNCE</span>
          <span className={styles.bookPages} aria-hidden="true">0{chapters.findIndex((item) => item.id === chapter) + 1} / 03</span>
        </div>
        <div className={styles.chapters} role="group" aria-label="Kural kitapçığının bölümleri">
          {chapters.map((item) => (
            <button key={item.id} type="button" aria-pressed={chapter === item.id} aria-controls={`${id}-chapter`} onClick={() => setChapter(item.id)}>
              {item.label}
            </button>
          ))}
        </div>

        <div id={`${id}-chapter`} className={styles.chapter} aria-live="polite" aria-atomic="true">
          {chapter === "basics" && (
            <>
              <h2>Dört kelime. Tek ortak nokta.</h2>
              <p>Bir grup; aynı aileden, aynı alandan ya da ortak bir ifadeden doğabilir. Seçtiğin dört kelimenin hepsine uyan bağı ara.</p>
              <div className={styles.exampleWords} aria-label="Örnek grup: müzik aletleri">
                {["Keman", "Piyano", "Flüt", "Davul"].map((word) => <span key={word}>{word}</span>)}
              </div>
              <p className={styles.exampleCaption}><span className={styles.captionLine} /> Ortak bağ: müzik aletleri <span className={styles.captionLine} /></p>
            </>
          )}
          {chapter === "words" && (
            <>
              <h2>Bazen bağ, görünmeyen bir kelimedir.</h2>
              <p>Örneğin bu dört kelimenin <strong>başına “KARA”</strong> gelir. Başına ya da sonuna eklenen ortak kelimeleri de düşün.</p>
              <div className={styles.wordEquation}>
                <span className={styles.prefix}>KARA <span aria-hidden="true">+</span></span>
                <div className={styles.exampleWords}>
                  {["Deniz", "Kedi", "Biber", "Kutu"].map((word) => <span key={word}>{word}</span>)}
                </div>
              </div>
              <p className={styles.exampleCaption}>Karadeniz · kara kedi · karabiber · kara kutu</p>
              <p className={styles.footnote}>Birleşik veya ayrı yazılabilir; önemli olan ortak ifade. Bunlar yalnızca örnek.</p>
            </>
          )}
          {chapter === "tricks" && (
            <>
              <h2>İlk aklına gelen bağ, tek bağ olmayabilir.</h2>
              <p>Bir kelime birkaç gruba uyuyor gibi görünebilir. Acele etme; seçtiğin <strong>dört kelimeyi birlikte</strong> düşün. Her kelime yalnızca bir gruba aittir.</p>
              <div className={styles.tip}><span aria-hidden="true">↳</span><p><strong>“Bir kelime uzaktasın”</strong> görürsen seçtiğin dört kelimenin üçü aynı gruptadır. Bu yardım Kolay ve Orta modda görünür; Zor modda görünmez.</p></div>
              <p className={styles.footnote}>Karıştırmak ve seçimi temizlemek hata hakkını azaltmaz. Yanlış bir gruplama 1 hata sayılır.</p>
            </>
          )}
        </div>
      </div>

      {!rulesOnly && (
        <>
          <fieldset className={styles.modeField}>
            <legend>Kendi ritmini seç <span>{distinctPuzzles ? "HER MODDA 6 FARKLI BULMACA" : "KLASİK ARŞİV · DESTEK SEÇİMİ"}</span></legend>
            <div className={styles.modes}>
              {modes.map((mode) => (
                <label key={mode.id} className={`${styles.mode} ${difficulty === mode.id ? styles.selectedMode : ""}`}>
                  <input type="radio" name={`${id}-difficulty`} value={mode.id} checked={difficulty === mode.id} onChange={() => setDifficulty(mode.id)} />
                  <span className={styles.modeTop}><strong>{mode.name}</strong><span className={styles.modeBars} aria-hidden="true">{[1, 2, 3].map((bar) => <i key={bar} data-active={bar <= mode.level} />)}</span></span>
                  <span className={styles.modeLabel}>{mode.label}</span>
                  <span className={styles.modeHint}>{mode.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className={styles.startRow}>
            <p>{difficulty === "hard" ? "Yakınlık uyarısı kapalı. Her bağ senin keşfin." : "Bir kelime uzaktaysan sana haber veririz."}<br /><span>Her modda 4 hata hakkı. Süre sınırı yok.</span></p>
            <button className={styles.start} type="button" onClick={() => onStart(difficulty)}>Bağlantıları bul <Arrow /></button>
          </div>
        </>
      )}
      {rulesOnly && onClose && <button className={`${styles.start} ${styles.return}`} type="button" onClick={onClose}>Oyuna dön <Arrow /></button>}
    </section>
  );
}

