"use client";

import Link from "next/link";

import { openConsentPreferences } from "@/lib/consent";

import styles from "./SiteFooter.module.css";

/** Her sayfanın altındaki bilgi bağlantıları; çerez tercihi buradan her an değiştirilir. */
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <nav aria-label="Site bilgileri" className={styles.links}>
        <Link href="/hakkimizda">Hakkımızda</Link>
        <Link href="/gizlilik-politikasi">Gizlilik ve çerezler</Link>
        <button type="button" className={styles.linkButton} onClick={openConsentPreferences}>
          Çerez tercihleri
        </button>
        <Link href="/iletisim">İletişim</Link>
      </nav>
    </footer>
  );
}
