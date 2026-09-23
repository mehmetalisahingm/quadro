import type { GameRestoreState } from "@/features/game/state/persistentGame";
import styles from "./GameNotice.module.css";

export function RecoveryNotice({ restore }: { restore: GameRestoreState }) {
  if (restore.status !== "discarded") return null;
  const updated = restore.reason === "puzzle-mismatch" || restore.reason === "schema-mismatch";
  return (
    <aside className={styles.recovery} role="status" aria-live="polite" aria-atomic="true">
      <h2>{updated ? "Kayıt bu sürümle uyuşmuyor" : "Kayıtlı ilerleme açılamadı"}</h2>
      <p>
        {updated ? "Bulmaca veya kayıt biçimi değişmiş." : "Bu bulmacanın ilerleme kaydı okunamadı."}
        {" "}Bu oyun için yeni bir tahta açtık. Önceki oyunların istatistikleri korunur.
      </p>
    </aside>
  );
}
