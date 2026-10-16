import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Group = { title: string; words: { id: string; text: string }[] };
type Candidate = { id: string; date: string; status: string; groups: Group[] };
const root = resolve(process.cwd(), "src/content/puzzles");
const blindRoot = resolve(process.cwd(), "src/content/editorial/blind");
const first = new Date(Date.UTC(2026, 9, 22));
const fileOf = (dir: string, day: string) => JSON.parse(readFileSync(join(dir, day + ".json"), "utf8"));
const normalized = (text: string) => text.trim().toLocaleUpperCase("tr-TR");
const signature = (group: Group) => group.words.map(word => normalized(word.text)).sort().join("|");

describe("new daily candidate stock (Q38)", () => {
  it("covers 16 contiguous dates with unique IDs, four groups and spoiler-free blind boards", () => {
    const ids = new Set<string>();
    const olderGroups = new Map<string, string>();
    for (let i = 0; i < 32; i += 1) {
      const day = new Date(Date.UTC(2026, 8, 20) + i * 86_400_000).toISOString().slice(0, 10);
      const old = fileOf(root, day) as Candidate;
      for (const group of old.groups) {
        if (!olderGroups.has(signature(group))) olderGroups.set(signature(group), day);
      }
      ids.add(old.id);
    }
    const duplicates: string[] = [];
    for (let i = 0; i < 16; i += 1) {
      const day = new Date(first.getTime() + i * 86_400_000).toISOString().slice(0, 10);
      const item = fileOf(root, day) as Candidate;
      const blind = fileOf(blindRoot, day) as { id: string; date: string; words: { id: string; text: string }[] };
      expect(item.date).toBe(day);
      expect(item.status, "Human approval must not be simulated").toBe("draft");
      expect(ids.has(item.id)).toBe(false);
      ids.add(item.id);
      expect(item.groups).toHaveLength(4);
      const words = item.groups.flatMap(group => group.words);
      expect(words).toHaveLength(16);
      expect(new Set(words.map(word => normalized(word.text))).size, day).toBe(16);
      expect(blind.id).toBe(item.id);
      expect(blind.date).toBe(day);
      expect(blind.words.map(word => word.id + ":" + word.text).sort()).toEqual(
        words.map(word => word.id + ":" + word.text).sort(),
      );
      for (const group of item.groups) {
        const sign = signature(group);
        if (olderGroups.has(sign)) duplicates.push(day + " duplicates " + olderGroups.get(sign) + ": " + group.title);
        olderGroups.set(sign, day);
      }
    }
    expect(duplicates).toEqual([]);
  });
});
