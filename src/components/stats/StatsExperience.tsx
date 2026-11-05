"use client";

import { useEffect, useState } from "react";
import { PictureStatsPanel } from "@/components/pictures/PictureStatsPanel";
import { readPictureProgress, type PictureBoardProgress } from "@/lib/persistence/pictureProgress";
import { loadPersonalStats, STATS_STORAGE_KEY, type StatsLoadResult } from "@/lib/persistence/statsStore";
import { AUTH_SESSION_EVENT, readStoredSession } from "@/lib/auth/client";
import { loadAccountGameResults, type AccountGameResult } from "@/lib/results/remote";
import { journeyStep } from "@/features/game/journey";
import { pictureBoardNumber } from "@/features/game/pictures";
import { TRACKS, trackIdentity } from "@/features/game/tracks";
import { StatsSummary } from "./StatsSummary";
import styles from "./Stats.module.css";

function gameLabel(puzzleId: string): string {
  const picture = pictureBoardNumber(puzzleId);
  if (picture !== null) return `Resimli Quadro · Tahta ${picture}`;
  const journey = journeyStep(puzzleId);
  if (journey !== null) return `Keşif Yolu · Adım ${journey}`;
  const track = trackIdentity(puzzleId);
  if (track) return `${TRACKS.find((item) => item.id === track.difficulty)?.label ?? "Bölüm"} · Bölüm ${track.level}`;
  return /^q-\d{3}$/.test(puzzleId) || /^daily-\d{4}-\d{2}-\d{2}-/.test(puzzleId)
    ? "Günlük bulmaca"
    : "Quadro oyunu";
}

export function StatsExperience() {
  const [loaded, setLoaded] = useState<StatsLoadResult | null>(null);
  const [pictures, setPictures] = useState<PictureBoardProgress[]>([]);
  const [account, setAccount] = useState<{ status: "loading" | "error" | "ready"; results: AccountGameResult[] } | null>(null);

  useEffect(() => {
    const read = () => {
      setLoaded(loadPersonalStats());
      setPictures(readPictureProgress());
    };
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

  useEffect(() => {
    let active = true;
    let generation = 0;
    let pending: AbortController | null = null;
    const refresh = () => {
      const current = readStoredSession();
      const request = ++generation;
      pending?.abort();
      if (!current) {
        setAccount(null);
        return;
      }
      pending = new AbortController();
      setAccount({ status: "loading", results: [] });
      void loadAccountGameResults(current, pending.signal).then((results) => {
        if (active && request === generation && readStoredSession()?.user.id === current.user.id) {
          setAccount({ status: "ready", results });
        }
      }).catch(() => {
        if (active && request === generation && readStoredSession()?.user.id === current.user.id) {
          setAccount({ status: "error", results: [] });
        }
      });
    };
    const timer = window.setTimeout(refresh, 0);
    window.addEventListener(AUTH_SESSION_EVENT, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("online", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      generation++;
      pending?.abort();
      window.clearTimeout(timer);
      window.removeEventListener(AUTH_SESSION_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("online", refresh);
      window.removeEventListener("focus", refresh);
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
      <PictureStatsPanel progress={pictures} />
      {account && <section className={styles.panel} aria-labelledby="account-history-title">
        <h2 id="account-history-title">Hesabındaki oyunlar</h2>
        {account.status === "loading" ? <p role="status">Hesap geçmişin yükleniyor…</p> :
          account.status === "error" ? <p role="status">Hesap geçmişi yüklenemedi. İnternet bağlantını kontrol edip sayfayı yenile.</p> :
            account.results.length === 0 ? <p>Hesabına kaydedilmiş oyun henüz yok.</p> : <>
              <p>Hesabına kaydedilmiş son {account.results.length} oyun. Yukarıdaki günlük istatistikler bu cihaza aittir.</p>
              <ul className={styles.history}>
                {account.results.map((result) => <li key={result.id}>
                  <span>{gameLabel(result.puzzleId)}</span>
                  <span>{result.result === "won" ? "Kazanıldı" : "Tamamlanamadı"} · {result.mistakes} hata</span>
                  <time dateTime={result.playedAt}>{new Date(result.playedAt).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" })}</time>
                </li>)}
              </ul>
            </>}
      </section>}
    </>
  );
}
