import type { Metadata } from "next";
import Link from "next/link";
import { EnglishPractice } from "./EnglishPractice";
import styles from "@/app/nasil-oynanir/guide.module.css";
import { ArcadeShell } from "@/components/arcade/ArcadeShell";

export const metadata: Metadata = {
  title: "Quadro — English word connections puzzles",
  description: "Play free English word grouping practice puzzles. Find four groups of four words.",
  alternates: { canonical: "/en" },
  openGraph: { locale: "en_US", title: "Quadro — English word connections puzzles", description: "Find four groups of four words." },
};
export default function EnglishPage() {
  return <ArcadeShell><article className={styles.layout} lang="en">
    <header className={styles.intro}><h1>Quadro — English practice</h1><p>Find four hidden connections among sixteen words. This English practice edition is separate from the Turkish daily game.</p><p><Link href="/">Türkçe sürüm / Turkish edition</Link></p></header>
    <EnglishPractice />
    <section className={styles.panel}><h2>How to play</h2><p>Select four related words, submit your group and find all four connections. You have four mistakes per board. Try another board or share your score with a friend.</p></section>
  </article></ArcadeShell>;
}
