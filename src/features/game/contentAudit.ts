/**
 * İçerik tekrar denetimi (#171).
 *
 * Tahtaları normalize edilmiş kelime ve grup imzalarıyla karşılaştırır: birebir aynı tahta,
 * aynı dörtlü (sıra farkı önemsiz), dörtte üçü aynı dörtlü ve aynı başlıklı benzer dörtlü.
 * Tek bir kelimenin başka tahtada geçmesi tekrar sayılmaz. Saf fonksiyonlardır; dosyaları
 * `scripts/content-audit.mjs` ve `src/lib/daily/contentAudit.test.ts` okur.
 *
 * Not: içe aktarım bilerek uzantılıdır; komut bu modülü Node'un TypeScript desteğiyle çalıştırır.
 */

import { normalizeTr } from "./contracts.ts";

export type AuditGroup = { title: string; words: readonly { text: string }[] };
export type AuditBoard = { pool: string; id: string; groups: readonly AuditGroup[] };
type GroupUse = { board: string; signature: string };

export const groupSignature = (group: AuditGroup): string =>
  group.words.map((word) => normalizeTr(word.text)).sort().join("|");

export const boardSignature = (board: AuditBoard): string =>
  board.groups.map(groupSignature).sort().join(" || ");

/** İki dörtlünün ortak kelime sayısı. */
export function overlap(a: string, b: string): number {
  const words = new Set(a.split("|"));
  return b.split("|").filter((word) => words.has(word)).length;
}

const label = (board: AuditBoard) => `${board.pool}:${board.id}`;

export type ContentAudit = {
  pools: Record<string, number>;
  boards: number;
  groups: number;
  /** Aynı 16 kelimeyi aynı dörtlülerle taşıyan tahta grupları. */
  exactBoards: string[][];
  /** Birden fazla tahtada geçen dörtlüler ve geçtiği tahtalar. */
  repeatedGroups: { signature: string; uses: string[] }[];
  /** Dört kelimesinden üçü aynı olan farklı dörtlü çiftleri. */
  nearGroups: { a: string; b: string }[];
  /** Aynı başlıkla ve en az iki ortak kelimeyle tekrarlanan dörtlüler. */
  sameTheme: { title: string; boards: string[] }[];
};

export function auditBoards(boards: readonly AuditBoard[]): ContentAudit {
  const byBoard = new Map<string, string[]>();
  const byGroup = new Map<string, GroupUse[]>();
  const byTitle = new Map<string, GroupUse[]>();
  const pools: Record<string, number> = {};
  let groups = 0;

  for (const board of boards) {
    pools[board.pool] = (pools[board.pool] ?? 0) + 1;
    const signature = boardSignature(board);
    byBoard.set(signature, [...(byBoard.get(signature) ?? []), label(board)]);
    for (const group of board.groups) {
      groups += 1;
      const use = { board: label(board), signature: groupSignature(group) };
      byGroup.set(use.signature, [...(byGroup.get(use.signature) ?? []), use]);
      const title = normalizeTr(group.title);
      byTitle.set(title, [...(byTitle.get(title) ?? []), use]);
    }
  }

  const unique = [...byGroup.entries()].map(([signature, uses]) => ({ signature, board: uses[0]!.board }));
  const nearGroups: ContentAudit["nearGroups"] = [];
  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      if (overlap(unique[i]!.signature, unique[j]!.signature) === 3) nearGroups.push({ a: unique[i]!.board, b: unique[j]!.board });
    }
  }

  const sameTheme: ContentAudit["sameTheme"] = [];
  for (const [title, uses] of byTitle) {
    const variants = [...new Map(uses.map((use) => [use.signature, use])).values()];
    for (let i = 0; i < variants.length; i++) {
      for (let j = i + 1; j < variants.length; j++) {
        if (overlap(variants[i]!.signature, variants[j]!.signature) >= 2) sameTheme.push({ title, boards: [variants[i]!.board, variants[j]!.board] });
      }
    }
  }

  return {
    pools,
    boards: boards.length,
    groups,
    exactBoards: [...byBoard.values()].filter((list) => list.length > 1),
    repeatedGroups: [...byGroup.entries()].filter(([, uses]) => uses.length > 1)
      .map(([signature, uses]) => ({ signature, uses: uses.map((use) => use.board) })),
    nearGroups,
    sameTheme,
  };
}
