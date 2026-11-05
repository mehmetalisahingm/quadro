import Image from "next/image";

import type { PuzzleWord } from "@/features/game/contracts";

/** Çözülen grubun görselleri. Nesne adları yanında metin olarak durduğu için görseller süsleyicidir. */
export function PictureStrip({ words }: { words: readonly PuzzleWord[] }) {
  return (
    <span className="q-picture-strip" aria-hidden="true">
      {words.map((word) =>
        word.image ? (
          <Image
            key={word.id}
            src={word.image.src}
            alt=""
            width={word.image.width}
            height={word.image.height}
            unoptimized
            draggable={false}
          />
        ) : null,
      )}
    </span>
  );
}
