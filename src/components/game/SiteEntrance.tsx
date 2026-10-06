"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { BoardPrelude } from "./BoardPrelude";

/** The brand opening belongs to site entry, independently of saved game progress. */
export function SiteEntrance({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [complete, setComplete] = useState(false);
  const isGameEntry = pathname === "/" || pathname === "/play";

  // Keep the real page mounted underneath the opening. This makes the entry
  // fail-safe: if hydration or the handoff timer ever fails, CSS still hides
  // the overlay and the user is never trapped on the opening screen.
  return (
    <>
      {children}
      {isGameEntry && !complete ? (
        <BoardPrelude onComplete={() => setComplete(true)} />
      ) : null}
    </>
  );
}
