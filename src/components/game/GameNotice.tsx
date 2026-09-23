import Link from "next/link";
import type { DailyMissingReason } from "@/lib/daily/dailyPuzzle";
import { RetryButton } from "./RetryButton";
import styles from "./GameNotice.module.css";

type Reason = DailyMissingReason | "unexpected";
const descriptions: Record<Reason, string> = {
  "no-content": "Bu gün için henüz bir bulmaca eklenmemiş. Biraz sonra yeniden kontrol edebilirsin.",
  "not-published": "Bu günün bulmacası henüz yayına açılmamış. Hazır olduğunda burada olacak.",
  "invalid-content": "Bu bulmacanın içeriğinde bir sorun var. Şimdilik kısa öğreticiyi deneyebilir veya biraz sonra yeniden bakabilirsin.",
  unreadable: "Bulmacaya şu an ulaşamıyoruz. Bağlantını kontrol edip yeniden deneyebilirsin.",
  unexpected: "Oyun ekranı yüklenirken bir sorun oluştu. Bağlantını kontrol edip yeniden deneyebilirsin.",
};

export function GameNotice({ reason }: { reason: Reason }) {
  const unavailable = reason === "no-content" || reason === "not-published";
  return (
    <section className="q-game-shell" aria-labelledby="daily-notice-title" data-status="missing" data-reason={reason}>
      <div className={styles.panel}>
        <div className={styles.mark} aria-hidden="true"><span /><span /><span /><span /></div>
        <p className={styles.eyebrow}>{unavailable ? "KISA BİR ARA" : "BİR ŞEYLER TERS GİTTİ"}</p>
        <h1 id="daily-notice-title" className="q-game-title">
          {unavailable ? "Bugün için bulmaca yok" : "Bugünün bulmacası açılamadı"}
        </h1>
        <p className={styles.copy}>{descriptions[reason]} Kayıtlı sonuçların bu işlemle silinmez.</p>
        <RetryButton />
        <p className={styles.links}>
          Bu arada <Link href="/play?mode=tutorial">kısa öğreticiyi</Link> deneyebilir veya <Link href="/">ana sayfaya dönebilirsin.</Link>
        </p>
      </div>
    </section>
  );
}
