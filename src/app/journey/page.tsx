import type { Metadata } from "next";
import { JourneyMap } from "@/components/journey/JourneyMap";
export const metadata: Metadata = { title: "Keşif Yolu", description: "200 adımda bağlantı ustalığı. Kolaydan başla, gizli bağları keşfederek yüksel." };
export default function JourneyPage() { return <JourneyMap />; }
