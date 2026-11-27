"use client";

import { openConsentPreferences } from "@/lib/consent";

/** Gizlilik sayfası gibi metin içinden tercih şeridini yeniden açar. */
export function ConsentPreferencesButton({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={openConsentPreferences}>
      Çerez tercihlerini aç
    </button>
  );
}
