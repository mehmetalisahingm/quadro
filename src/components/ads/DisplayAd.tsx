"use client";

import Script from "next/script";
import { useRef } from "react";
import { ADSENSE_CLIENT } from "@/lib/ads/config";
import styles from "./DisplayAd.module.css";

export function DisplayAd({ slot }: { slot: string }) {
  const unit = useRef<HTMLModElement>(null);
  const requested = useRef(false);

  function requestAd() {
    if (requested.current || !unit.current || window.location.hostname !== "playquadro.com.tr") return;
    const adWindow = window as Window & { adsbygoogle?: Array<Record<string, never>> };
    requested.current = true;
    try {
      (adWindow.adsbygoogle ??= []).push({});
    } catch {
      // Blocked or unavailable advertisements must never interrupt the guide.
    }
  }

  return <aside className={styles.container} aria-label="Reklam">
    <span className={styles.label}>Reklam</span>
    <ins ref={unit} className="adsbygoogle" style={{ display: "block" }}
      data-ad-client={ADSENSE_CLIENT} data-ad-slot={slot}
      data-ad-format="auto" data-full-width-responsive="true" />
    <Script id="quadro-adsense" strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous" onReady={requestAd} />
  </aside>;
}
