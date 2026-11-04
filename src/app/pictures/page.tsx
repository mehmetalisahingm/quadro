import type { Metadata } from "next";

import { PictureLobby } from "@/components/pictures/PictureLobby";

export const metadata: Metadata = {
  title: "Resimli Quadro",
  description: "On altı çizim, dört gizli bağ. Ortak bağı olan görselleri bul.",
};

export default function PicturesPage() {
  return <main className="q-page-shell"><PictureLobby /></main>;
}
