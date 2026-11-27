"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import {
  CONSENT_OPEN_EVENT,
  consentSnapshot,
  readConsent,
  saveConsent,
  serverConsentSnapshot,
  subscribeConsent,
  type ConsentCategories,
} from "@/lib/consent";

import styles from "./ConsentBanner.module.css";

/**
 * Çerez onay şeridi. Footer'dan yeniden açıldığında kullanıcı sayfanın altında olduğu
 * için alttan sabit panel olarak görünür; bunu kullanıcı kendisi istemiştir.
 *
 * İlk ziyarette: Karar verilene kadar sayfa akışının en üstünde durur: sabit bir
 * katman değildir, bu yüzden hiçbir ekran boyutunda oyun tahtasının ya da kontrollerin
 * üstüne binmez, yalnız içeriği aşağı iter. "Reddet" ve "Kabul et" aynı boyut ve
 * vurguyla yan yanadır.
 */
export function ConsentBanner({ adsAvailable = false }: { adsAvailable?: boolean }) {
  const snapshot = useSyncExternalStore(subscribeConsent, consentSnapshot, serverConsentSnapshot);
  const [reopened, setReopened] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [ads, setAds] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  const visible = snapshot === "undecided" || reopened;

  useEffect(() => {
    const open = () => {
      const current = readConsent();
      setAnalytics(current?.analytics ?? false);
      setAds(current?.ads ?? false);
      setCustomizing(true);
      setReopened(true);
    };
    window.addEventListener(CONSENT_OPEN_EVENT, open);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, open);
  }, []);

  useEffect(() => {
    if (reopened) heading.current?.focus();
  }, [reopened]);

  if (!visible) return null;

  const decide = (categories: ConsentCategories) => {
    saveConsent({ analytics: categories.analytics, ads: adsAvailable && categories.ads });
    setReopened(false);
    setCustomizing(false);
  };

  return (
    <section className={reopened ? `${styles.banner} ${styles.floating}` : styles.banner} aria-labelledby="consent-title" aria-describedby="consent-text" data-testid="consent-banner">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <h2 id="consent-title" ref={heading} tabIndex={-1} className={styles.title}>Çerez tercihleri</h2>
          <p id="consent-text" className={styles.text}>
            İzin verirsen oyunu iyileştirmek için anonim kullanım ölçümü yaparız: hangi bağlantıdan geldiğin,
            sonraki günlerde geri dönüp dönmediğin ve bulmacaların nasıl oynandığı. Veriler AB&apos;deki sunucularda tutulur.
            {adsAvailable ? " Reklam onayı, Google reklamlarının çerez kullanmasına izin verir." : ""}
            {" "}Reddedersen oyun aynen çalışır. <Link href="/gizlilik-politikasi">Ayrıntılar</Link>
          </p>
        </div>

        {customizing ? (
          <fieldset className={styles.choices}>
            <legend className={styles.legend}>Kategoriler</legend>
            <label className={styles.choice}>
              <input type="checkbox" checked disabled />
              <span><strong>Zorunlu</strong> · oyun ilerlemesi ve bu tercih. Kapatılamaz.</span>
            </label>
            <label className={styles.choice}>
              <input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} />
              <span><strong>Analitik</strong> · anonim ölçüm (PostHog, AB).</span>
            </label>
            {adsAvailable ? (
              <label className={styles.choice}>
                <input type="checkbox" checked={ads} onChange={(event) => setAds(event.target.checked)} />
                <span><strong>Reklam</strong> · Google reklam çerezleri.</span>
              </label>
            ) : null}
          </fieldset>
        ) : null}

        <div className={styles.actions}>
          <button type="button" className={styles.button} onClick={() => decide({ analytics: false, ads: false })}>
            Reddet
          </button>
          <button type="button" className={styles.button} onClick={() => decide({ analytics: true, ads: true })}>
            Kabul et
          </button>
          {customizing ? (
            <button type="button" className={styles.secondary} onClick={() => decide({ analytics, ads })}>
              Seçimi kaydet
            </button>
          ) : (
            <button type="button" className={styles.secondary} onClick={() => setCustomizing(true)} aria-expanded={false}>
              Ayarla
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
