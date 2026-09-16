import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quadro",
  description:
    "Türkçe günlük gruplama bulmacası: 16 kelime, 4 gizli bağ, 4 hata hakkı.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
