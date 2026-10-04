"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { BoardPrelude } from "./BoardPrelude";

/** The brand opening belongs to site entry, independently of saved game progress. */
export function SiteEntrance({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [complete, setComplete] = useState(false);
  const isGameEntry = pathname === "/" || pathname === "/play";

  // Keep gameplay unmounted until the opening ends so its clock cannot run behind it.
  // Layout state survives in-app navigation; a refresh always starts a new opening.
  if (isGameEntry && !complete) {
    return <BoardPrelude onComplete={() => setComplete(true)} />;
  }

  return children;
}
