import type { Metadata } from "next";
import { ArcadeJourney } from "@/components/arcade/ArcadeJourney";
export const metadata: Metadata = { title: "Keşif Yolu", description: "200 adımda bağlantı ustalığı. Kolaydan başla, gizli bağları keşfederek yüksel.", alternates: { canonical: "/journey" } };
export default function JourneyPage() { return <ArcadeJourney />; }
