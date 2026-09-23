"use client";

import { useEffect, useState } from "react";
import { loadPersonalStats, STATS_STORAGE_KEY, type StatsLoadResult } from "@/lib/persistence/statsStore";
import { StatsSummary } from "./StatsSummary";
import styles from "./Stats.module.css";

export function StatsExperience() {
  const [loaded, setLoaded] = useState<StatsLoadResult | null>(null);

  useEffect(() => {
    const read = () => setLoaded(loadPersonalStats());
    // Storage is read only after hydration; no placeholder zeroes are shown as real results.
    const frame = requestAnimationFrame(read);
    const onStorage = (event: StorageEvent) => {
      if (event.key === STATS_STORAGE_KEY || event.key === null) read();
    };
    const onVisible = () => { if (document.visibilityState === "visible") read(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", read);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", read);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (loaded === null) {
    return (
      <div className={styles.loading} aria-busy="true">
        <p role="status">Bu tarayıcıdaki sonuçların yükleniyor…</p>
        <div className={styles.loadingBlocks} aria-hidden="true"><span /><span /><span /><span /></div>
      </div>
    );
  }

  return (
    <>
      {loaded.status === "recovered" ? (
        <p className={styles.warning} role="status">İstatistik kaydı okunamadığı için sayılar yeniden başladı. Günlük oyun ilerlemene dokunulmadı.</p>
      ) : null}
      <StatsSummary stats={loaded.stats} />
    </>
  );
}
