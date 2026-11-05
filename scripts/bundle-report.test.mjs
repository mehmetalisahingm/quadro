import test from "node:test";
import assert from "node:assert/strict";

import { formatKb, groupByFolder, summarize } from "./bundle-report.mjs";

test("özet toplar ve en büyükleri sıralar", () => {
  const result = summarize([
    { path: "a.js", bytes: 100, gzipBytes: 40 },
    { path: "b.js", bytes: 300, gzipBytes: 90 },
    { path: "c.js", bytes: 200, gzipBytes: 70 },
  ], 2);
  assert.equal(result.files, 3);
  assert.equal(result.bytes, 600);
  assert.equal(result.gzipBytes, 200);
  assert.deepEqual(result.largest.map((file) => file.path), ["b.js", "c.js"]);
});

test("boş liste hata vermez", () => {
  assert.deepEqual(summarize([]), { files: 0, bytes: 0, gzipBytes: 0, largest: [] });
});

test("public varlıkları ilk klasör düzeyinde gruplanır, büyükten küçüğe sıralanır", () => {
  const groups = groupByFolder([
    { path: "images/journey/a.webp", bytes: 500 },
    { path: "images/journey/b.webp", bytes: 500 },
    { path: "images/pictures/c.svg", bytes: 10 },
    { path: "favicon.ico", bytes: 20 },
  ]);
  assert.deepEqual(groups.map((group) => [group.folder, group.bytes]), [
    ["images/journey", 1000],
    ["favicon.ico", 20],
    ["images/pictures", 10],
  ]);
});

test("KB biçimi", () => assert.equal(formatKb(1536), "1.5 KB"));
