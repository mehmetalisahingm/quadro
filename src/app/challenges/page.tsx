import type { Metadata } from "next";
import Link from "next/link";
import { ArcadeShell, ArcadeTitle } from "@/components/arcade/ArcadeShell";
import styles from "@/components/arcade/ArcadeHub.module.css";

export const metadata: Metadata = { title: "Özel Meydan Okumalar", description: "Risk, Çarpan Merdiveni ve Bomba Kart modlarını keşfet." };

const modes = [
  { href: "/play?mode=risk", icon: "🎲", title: "Risk", detail: "Ne kadar eminsin? Her tahminde puan yatır, doğru bağlantıyla kazancını büyüt.", note: "100 puanla başla" },
  { href: "/play?mode=ladder", icon: "📈", title: "Çarpan Merdiveni", detail: "Her doğru grupta çarpanını artır. Devam et ya da puanlarını kasaya al.", note: "Devam mı, kasa mı?" },
  { href: "/play?mode=bomb", icon: "💣", title: "Bomba Kart", detail: "Bombalı kartı doğru grupta kullan. Bombalı yanlış seçim iki hata hakkı götürür.", note: "Stratejini seç" },
] as const;

export default function ChallengesPage() {
  return <ArcadeShell active="play">
    <ArcadeTitle title="Özel Meydan Okumalar" description="Becerini sına, kendi oyununu seç!" />
    <section className={styles.panel}><span className={styles.eyebrow}>ÜÇ FARKLI OYUN</span><h2>Bugün nasıl oynayacaksın?</h2><p>Özel oyunlar 10 canla başlar. Her 10 dakikada 10 can yenilenir. Üç oyunda 1.500 puana ulaş, 30 canını doldur!</p></section>
    <div className={styles.grid3}>{modes.map((mode) => <Link className={styles.card} href={mode.href} key={mode.href}><span className={styles.cardIcon} aria-hidden="true">{mode.icon}</span><strong>{mode.title}</strong><small>{mode.detail}</small><em>{mode.note} · Oyna →</em></Link>)}</div>
    <section className={styles.panel}><h2>✦ Yolculuğun devam ediyor</h2><p>Diğer oyunlardaki ilerlemeni ve kazandığın başarıları pasaportunda görebilirsin.</p><p style={{ marginTop: 18 }}><Link className={styles.button} href="/passport">Pasaportuma git →</Link></p></section>
  </ArcadeShell>;
}

