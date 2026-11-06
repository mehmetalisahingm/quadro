import type { Metadata } from "next";
import { ArcadePassport } from "@/components/arcade/ArcadePassport";

export const metadata: Metadata = { title: "Quadro Pasaportu", description: "Quadro yolculuğunu ve oyun ilerlemeni gör." };
export default function PassportPage() { return <ArcadePassport />; }
