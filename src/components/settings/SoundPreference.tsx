"use client";

import styles from "./SoundPreference.module.css";

export type SoundPreferenceProps = {
  enabled: boolean;
  onChange: (enabled: boolean) => Promise<void> | void;
};

export function SoundPreference({ enabled, onChange }: SoundPreferenceProps) {
  return (
    <div className={styles.root} aria-label="Ses tercihi">
      <span className={styles.copy}>Kısa oyun sesleri</span>
      <button
        type="button"
        className={styles.toggle}
        aria-pressed={enabled}
        onClick={() => void onChange(!enabled)}
      >
        {enabled ? "Ses açık" : "Ses kapalı"}
      </button>
    </div>
  );
}
