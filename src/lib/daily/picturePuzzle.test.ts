import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { normalizeTr } from "@/features/game/contracts";
import { standardPuzzle } from "@/features/game/fixtures/puzzles";
import { gameModeOf, modeStorageKey } from "@/features/game/modes";
import { PICTURE_BOARD_COUNT, PICTURE_BOARDS, pictureBoardNumber, pictureId } from "@/features/game/pictures";
import { validatePictureBoard, validatePuzzle } from "@/features/game/validator";

import { loadPicturePuzzle } from "./picturePuzzle";

const raw = (board: number) => JSON.parse(readFileSync(`src/content/pictures/${board}.json`, "utf8"));

describe("Resimli Quadro içeriği", () => {
  it("üç tahta kimlik, gün ve revizyon kaydıyla eşleşir; kurallardan temiz geçer", async () => {
    expect(PICTURE_BOARD_COUNT).toBe(3);
    expect(readdirSync("src/content/pictures").filter((name) => name.endsWith(".json"))).toHaveLength(3);
    for (const entry of PICTURE_BOARDS) {
      const value = raw(entry.board);
      expect(validatePuzzle(value, { requireEditorialFields: true })).toEqual([]);
      expect(validatePictureBoard(value)).toEqual([]);
      const puzzle = await loadPicturePuzzle(entry.board);
      expect(puzzle?.id).toBe(pictureId(entry.board));
      expect(puzzle?.date).toBe(entry.day);
      expect(puzzle?.revision).toBe(entry.revision);
      expect(puzzle?.groups[0].words[0].image?.src).toMatch(/^\/images\/pictures\//);
      expect(puzzle).not.toHaveProperty("author");
    }
  });

  it("görseller diskte, küçük, betiksiz ve kaynak kaydı bulunuyor", () => {
    const assets: { src: string; source: string; author: string; license: string }[] = JSON.parse(
      readFileSync("src/content/editorial/pictures/assets.json", "utf8"),
    );
    const recorded = new Map(assets.map((asset) => [asset.src, asset]));
    for (const { board } of PICTURE_BOARDS) {
      for (const group of raw(board).groups) {
        for (const word of group.words) {
          const path = join("public", word.image.src);
          expect(existsSync(path), path).toBe(true);
          const svg = readFileSync(path, "utf8");
          expect(svg.length).toBeLessThan(5_000);
          expect(svg).not.toMatch(/<script|<text|<title|href=|on[a-z]+=/i);
          const record = recorded.get(word.image.src);
          expect(record?.source && record.author && record.license, word.image.src).toBeTruthy();
        }
      }
    }
  });

  it("açıklamalar ve dosya adları grubu ele vermez", () => {
    for (const { board } of PICTURE_BOARDS) {
      for (const group of raw(board).groups) {
        for (const word of group.words) {
          expect(normalizeTr(word.image.alt)).not.toContain(normalizeTr(group.title));
          expect(word.id).toMatch(/^picture-\d{3}-w\d+$/);
          expect(word.image.src).not.toContain(group.id);
        }
      }
    }
  });

  it("günlük bulmacalar ve fixture'larla kelime veya başlık paylaşmaz", () => {
    const texts = new Set<string>();
    const titles = new Set<string>();
    const collect = (groups: { title: string; words: { text: string }[] }[]) => {
      for (const group of groups) {
        titles.add(normalizeTr(group.title));
        for (const word of group.words) texts.add(normalizeTr(word.text));
      }
    };
    for (const name of readdirSync("src/content/puzzles").filter((file) => file.endsWith(".json"))) {
      collect(JSON.parse(readFileSync(`src/content/puzzles/${name}`, "utf8")).groups);
    }
    collect(standardPuzzle.groups);
    for (const { board } of PICTURE_BOARDS) {
      for (const group of raw(board).groups) {
        expect(titles.has(normalizeTr(group.title)), group.title).toBe(false);
        for (const word of group.words) expect(texts.has(normalizeTr(word.text)), word.text).toBe(false);
      }
    }
  });

  it("geçersiz tahta numaralarını ve yabancı kimlikleri reddeder", async () => {
    for (const board of [0, 4, -1, 1.5, Number.NaN]) expect(await loadPicturePuzzle(board)).toBeNull();
    expect(pictureBoardNumber("journey-001")).toBeNull();
    expect(pictureBoardNumber("picture-004")).toBeNull();
    expect(gameModeOf("picture-001")).toBe("picture");
    expect(gameModeOf("q-001")).toBe("classic");
    expect(modeStorageKey("picture", "picture-001", 2, "x")).toBe("quadro:modes:v1:picture:picture-001:r2:x");
  });
});

describe("validatePictureBoard", () => {
  const board = () => raw(1);
  const codes = (value: unknown) => validatePictureBoard(value).map((issue) => issue.code);

  it("eksik görseli, yolu, açıklamayı ve ölçüyü yakalar", () => {
    const missing = board(); delete missing.groups[0].words[0].image;
    expect(codes(missing)).toContain("picture-image");

    const remote = board(); remote.groups[0].words[0].image.src = "https://ornek.test/a.png";
    expect(codes(remote)).toContain("picture-image-src");

    const noAlt = board(); noAlt.groups[0].words[0].image.alt = " ";
    expect(codes(noAlt)).toContain("picture-image-alt");

    const spoiler = board(); spoiler.groups[0].words[0].image.alt = `${spoiler.groups[0].title} örneği`;
    expect(codes(spoiler)).toContain("picture-image-alt");

    const wide = board(); wide.groups[0].words[0].image.width = 300;
    expect(codes(wide)).toContain("picture-image-size");

    const same = board(); same.groups[0].words[1].image.src = same.groups[0].words[0].image.src;
    expect(codes(same)).toContain("picture-image-duplicate");

    const foreign = board(); foreign.id = "q-001";
    expect(codes(foreign)).toContain("picture-id");
  });
});
