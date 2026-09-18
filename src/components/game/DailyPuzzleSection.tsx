import Link from "next/link";

import type { DailyMissingReason, DailyPuzzleState } from "@/lib/daily";

import { GameBoard } from "./GameBoard";

/**
 * Günün içerik durumunu ekrana bağlayan sunucu bileşeni (Q19).
 *
 * İçerik varsa tahtayı açar, yoksa sade bir bilgi kartı gösterir. Bu kart bilinçli
 * olarak asgaridir: yükleme, içerik hatası ve kayıt kurtarma ekranlarının asıl
 * tasarımı Q24'ün kapsamındadır ve Mehmet'tedir. Buradaki amaç yalnız "bugün oyun
 * yok" durumunda oyuncuyu boş sayfayla baş başa bırakmamaktır.
 *
 * Gerekçe (`data-reason`) işaretlemede taşınır: Q24 ekranını yazarken hangi durumun
 * çizildiğini ayırt etmek için kullanılır, oyuncuya gösterilmez.
 */

/** Tahtanın açılmadığı durumlar; `loading` dışındakiler yükleyicinin gerekçeleridir. */
type NoticeReason = DailyMissingReason | "loading";

/** Gerekçeye karşılık gelen, oyuncuya gösterilen başlık ve tek cümle. */
const noticeCopy: Record<NoticeReason, { title: string; description: string }> = {
  loading: {
    title: "Bugünün bulmacası hazırlanıyor",
    description: "Bir saniye içinde tahta açılacak.",
  },
  "no-content": {
    title: "Bugün için bulmaca yok",
    description:
      "Bugünün bulmacası henüz yayında değil. Yeni bulmaca Türkiye saatiyle gece yarısı açılır.",
  },
  "not-published": {
    title: "Bugün için bulmaca yok",
    description:
      "Bugünün bulmacası henüz yayında değil. Yeni bulmaca Türkiye saatiyle gece yarısı açılır.",
  },
  "invalid-content": {
    title: "Bugünün bulmacası açılamadı",
    description: "İçerikte bir sorun var. En kısa sürede düzeltiyoruz.",
  },
  unreadable: {
    title: "Bugünün bulmacası açılamadı",
    description: "İçerik şu an okunamıyor. Biraz sonra tekrar dener misin?",
  },
};

export type DailyPuzzleSectionProps = {
  /** Sunucuda çözülmüş günlük içerik durumu. */
  state: DailyPuzzleState;
};

export function DailyPuzzleSection({ state }: DailyPuzzleSectionProps) {
  if (state.status === "ok") return <GameBoard puzzle={state.puzzle} />;

  const reason: NoticeReason = state.status === "loading" ? "loading" : state.reason;
  const copy = noticeCopy[reason];

  return (
    <section
      className="q-game-shell"
      aria-labelledby="daily-notice-title"
      data-status={state.status}
      data-reason={reason}
    >
      <div className="q-game-intro">
        <h1 id="daily-notice-title" className="q-game-title">
          {copy.title}
        </h1>
        <p className="q-game-description">{copy.description}</p>
        <p className="q-game-description">
          Bu arada <Link href="/play?mode=tutorial">kısa öğreticiyi</Link> deneyebilirsin.
        </p>
      </div>
    </section>
  );
}
