"use client";
import { createContext, useContext, type ReactNode } from "react";
import { DisplayAd } from "./DisplayAd";

type Slots = { home: string | null; result: string | null };
const SlotContext = createContext<Slots>({ home: null, result: null });
export function PlacementAdsProvider({ slots, children }: { slots: Slots; children: ReactNode }) {
  return <SlotContext.Provider value={slots}>{children}</SlotContext.Provider>;
}
export function PlacementAd({ placement }: { placement: keyof Slots }) {
  const slot = useContext(SlotContext)[placement];
  return slot ? <DisplayAd slot={slot} /> : null;
}
