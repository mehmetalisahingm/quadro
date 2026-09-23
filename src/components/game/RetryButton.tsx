"use client";

import { useState } from "react";
import styles from "./GameNotice.module.css";

export function RetryButton() {
  const [pending, setPending] = useState(false);
  const [offline, setOffline] = useState(false);

  function retry() {
    if (!navigator.onLine) {
      setOffline(true);
      return;
    }
    setOffline(false);
    setPending(true);
    // Retry server rendering as well, preserving the selected day and local saves.
    window.location.reload();
  }

  return (
    <div className={styles.retry}>
      <button className="q-game-control q-game-submit" type="button" onClick={retry} disabled={pending}>
        {pending ? "Yeniden yükleniyor…" : "Yeniden dene"}
      </button>
      <p role="status" aria-live="polite">
        {offline ? "İnternet bağlantısı yok. Bağlandıktan sonra yeniden deneyebilirsin." : ""}
      </p>
    </div>
  );
}
