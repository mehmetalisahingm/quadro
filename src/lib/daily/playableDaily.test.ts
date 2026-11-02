import { describe, expect, it } from "vitest";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadPlayableDaily } from "./playableDaily";
import easy from "@/content/modes/easy-1.json";
import reserve from "@/content/daily-reserve.json";

describe("daily continuity", () => {
  it("provides distinct stable daily selections across an entire reserve cycle and beyond", async () => {
    const ids = new Set();
    const boards = new Set();
    for (let i = 0; i < reserve.files.length + 2; i++) {
      const dayKey = new Date(Date.UTC(2030, 0, i + 1)).toISOString().slice(0, 10);
      const daily = await loadPlayableDaily({ dayKey });
      expect(daily.status).toBe("ok");
      if (daily.status !== "ok") throw new Error(dayKey);
      expect(daily.puzzle.date).toBe(dayKey);
      expect(daily.source).toMatch(/^reserve:/);
      expect(ids.has(daily.puzzle.id)).toBe(false);
      ids.add(daily.puzzle.id);
      if (i < reserve.files.length) boards.add(daily.puzzle.groups.flatMap(g => g.words.map(w => w.text)).sort().join("|"));
    }
    expect(boards.size).toBe(reserve.files.length);
    expect(await loadPlayableDaily({ dayKey: "2030-01-01" })).toEqual(await loadPlayableDaily({ dayKey: "2030-01-01" }));
  });
  it("prefers published content, never serves drafts, and safely handles an empty reserve", async () => {
    const contentDir = await mkdtemp(join(tmpdir(), "quadro-daily-"));
    try {
      const dayKey = "2030-01-01";
      const file = { ...easy, date: dayKey, id: "q-999", status: "published" };
      await writeFile(join(contentDir, `${dayKey}.json`), JSON.stringify(file));
      const published = await loadPlayableDaily({ dayKey, contentDir });
      expect(published.status === "ok" && published.puzzle.id).toBe("q-999");
      await writeFile(join(contentDir, `${dayKey}.json`), JSON.stringify({ ...file, status: "draft" }));
      expect((await loadPlayableDaily({ dayKey, contentDir, reserveDir: contentDir })).status).toBe("missing");
      const selection = await loadPlayableDaily({ dayKey, contentDir, reserveDir: "src/content/modes" });
      expect(selection.status === "ok" && selection.source.startsWith("reserve:")).toBe(true);
      expect((await loadPlayableDaily({ dayKey: "2030-02-30" })).status).toBe("missing");
    } finally { await rm(contentDir, { recursive: true, force: true }); }
  });
});
