import Link from "next/link";

import styles from "./HomeHero.module.css";

export type HomePlayerState = "new" | "in-progress" | "completed";

export type HomeHeroProps = {
  state: HomePlayerState;
  puzzleNumber: number;
  dateLabel: string;
  progressLabel?: string;
};

type StateCopy = {
  eyebrow: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

const copyByState: Record<HomePlayerState, StateCopy> = {
  new: {
    eyebrow: "GÜNLÜK BULMACA",
    title: "16 kelime. 4 gizli bağ.",
    description: "Dört kelimenin ortak noktasını bul, dört grubu tamamla.",
    primaryLabel: "Bugünün bulmacasını çöz",
    primaryHref: "/play",
    secondaryLabel: "Kısa örneği dene",
    secondaryHref: "/play?mode=tutorial",
  },
  "in-progress": {
    eyebrow: "OYUN DEVAM EDİYOR",
    title: "Bulmacan seni bekliyor.",
    description: "Kaldığın yer ve seçtiğin sıra bu cihazda korunur.",
    primaryLabel: "Kaldığın yerden devam et",
    primaryHref: "/play",
    secondaryLabel: "Nasıl oynanır?",
    secondaryHref: "/play?mode=tutorial",
  },
  completed: {
    eyebrow: "BUGÜN TAMAMLANDI",
    title: "Bugünün bağlantıları tamamlandı.",
    description: "Sonucuna göz at; yeni günlük bulmaca yarın seni bekliyor.",
    primaryLabel: "Sonucunu gör",
    primaryHref: "/play?view=result",
  },
};

const motifCells = Array.from({ length: 16 }, (_, index) => index);

export function HomeHero({
  state,
  puzzleNumber,
  dateLabel,
  progressLabel,
}: HomeHeroProps) {
  const copy = copyByState[state];

  return (
    <section className={styles.hero} aria-labelledby="home-hero-title">
      <div className={styles.copy}>
        <div className={styles.brandRow}>
          <span className={styles.brand}>QUADRO</span>
          <span className={styles.dot} aria-hidden="true">
            ·
          </span>
          <span className={styles.eyebrow}>{copy.eyebrow}</span>
        </div>

        <h1 id="home-hero-title" className={styles.title}>
          {copy.title}
        </h1>
        <p className={styles.description}>{copy.description}</p>

        <div className={styles.meta} aria-label="Günün bulmacası">
          <span>#{puzzleNumber}</span>
          <span aria-hidden="true">•</span>
          <span>{dateLabel}</span>
        </div>

        {progressLabel ? (
          <p className={styles.progress} aria-live="polite">
            {progressLabel}
          </p>
        ) : null}

        <div className={styles.actions}>
          <Link className={styles.primaryAction} href={copy.primaryHref}>
            {copy.primaryLabel}
          </Link>

          {copy.secondaryHref && copy.secondaryLabel ? (
            <Link className={styles.secondaryAction} href={copy.secondaryHref}>
              {copy.secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>

      <div className={styles.motif} aria-hidden="true">
        <div className={styles.motifHeader}>
          <span>4×4</span>
          <span>HER GÜN YENİ</span>
        </div>
        <div className={styles.grid}>
          {motifCells.map((cell) => (
            <span key={cell} className={styles.cell} />
          ))}
        </div>
        <p className={styles.motifCaption}>Bağlantıları gör. Grupları kur.</p>
      </div>
    </section>
  );
}
