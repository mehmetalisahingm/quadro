"use client";

import { useLinkStatus } from "next/link";

/** Shows feedback only while a slow server navigation is in flight. */
export function NavigationPending() {
  const { pending } = useLinkStatus();
  return <span role="status" aria-live="polite">{pending ? " Yükleniyor…" : ""}</span>;
}
