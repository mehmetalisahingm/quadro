"use client";

import Image from "next/image";
import { useState } from "react";

import type { TileAnimationVerdict } from "@/animations/gameTransitions";
import type { PuzzleWordImage, WordId } from "@/features/game/contracts";

import motionStyles from "./GameAnimations.module.css";

export type PictureTileProps = {
  id: WordId;
  image: PuzzleWordImage;
  selected: boolean;
  disabled?: boolean;
  animation?: TileAnimationVerdict | null;
  onToggle: (wordId: WordId) => void;
};

/** Görsel kart. Yükleme başarısız olsa da nesne açıklamasıyla seçilebilir kalır. */
export function PictureTile({
  id,
  image,
  selected,
  disabled = false,
  animation = null,
  onToggle,
}: PictureTileProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "failed">("loading");
  const [attempt, setAttempt] = useState(0);
  const animationClass =
    animation === "wrong"
      ? motionStyles.tileWrong
      : animation === "one-away"
        ? motionStyles.tileOneAway
        : "";

  return (
    <div className="q-picture-slot">
      <button
        type="button"
        className={`q-word-tile q-picture-tile${animationClass ? ` ${animationClass}` : ""}`}
        aria-pressed={selected}
        aria-label={image.alt}
        disabled={disabled}
        data-animation={animation ?? undefined}
        data-image-status={status}
        onClick={() => onToggle(id)}
      >
        {status === "failed" ? (
          <span className="q-picture-fallback">{image.alt}</span>
        ) : (
          <Image
            key={attempt}
            className="q-picture-image"
            src={attempt === 0 ? image.src : `${image.src}?deneme=${attempt}`}
            alt=""
            width={image.width}
            height={image.height}
            sizes="(max-width: 480px) 25vw, 160px"
            loading="eager"
            unoptimized
            draggable={false}
            onLoad={() => setStatus("loaded")}
            onError={() => setStatus("failed")}
          />
        )}
      </button>
      {status === "failed" ? (
        <button
          type="button"
          className="q-picture-retry"
          aria-label={`${image.alt} görselini yeniden yükle`}
          onClick={() => {
            setAttempt((value) => value + 1);
            setStatus("loading");
          }}
        >
          <span aria-hidden="true">↻</span>
        </button>
      ) : null}
    </div>
  );
}
