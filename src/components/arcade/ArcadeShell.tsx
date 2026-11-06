import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./ArcadeShell.module.css";

type Section = "home" | "play" | "passport" | "stats";

export function ArcadeShell({ children, active = "home" }: { children: ReactNode; active?: Section }) {
  const links = [
    { href: "/", icon: "⌂", label: "Ana Sayfa", id: "home" },
    { href: "/play", icon: "✣", label: "Oyna", id: "play" },
    { href: "/passport", icon: "✧", label: "Pasaport", id: "passport" },
    { href: "/stats", icon: "▥", label: "İstatistik", id: "stats" },
  ] as const;
  return <div className={styles.page} data-arcade-page>
    <div className={styles.inner}>
      <div className={styles.topline}><Link href="/" className={styles.miniBrand} aria-label="Quadro ana sayfa">Q<span>✦</span></Link><div><strong>QUADRO</strong><small>BAĞLANTILARI KEŞFET</small></div></div>
      {children}
      <nav className={styles.navigation} aria-label="Ana gezinme">
        {links.map((link) => <Link key={link.id} href={link.href} className={styles.navItem} aria-current={active === link.id ? "page" : undefined}><span aria-hidden="true">{link.icon}</span><strong>{link.label}</strong></Link>)}
      </nav>
    </div>
  </div>;
}

export function ArcadeTitle({ eyebrow, title, description }: { eyebrow?: string; title: string; description: string }) {
  return <header className={styles.title}><span className={styles.wordmark}>QUADRO</span>{eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}<h1>{title}</h1><p>{description}</p></header>;
}
