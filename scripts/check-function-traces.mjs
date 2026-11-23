import { readFileSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";

// The daily reserve loader reads at runtime. A broad filesystem trace silently
// embeds public assets and editorial/test files in each deployed function.
const traces = [
  [".next/server/app/page.js.nft.json", ["src/content/puzzles/", "src/content/modes/"]],
  [".next/server/app/play/page.js.nft.json", ["src/content/puzzles/", "src/content/modes/"]],
  [".next/server/app/api/health/route.js.nft.json", ["src/content/puzzles/", "src/content/modes/"]],
  [".next/server/app/api/game-results/route.js.nft.json", ["src/content/puzzles/", "src/content/modes/", "src/content/journey/", "src/content/pictures/"]],
  [".next/server/app/api/challenge-puzzle/route.js.nft.json", ["src/content/modes/"]],
];
for (const [file, required] of traces) {
  const { files } = JSON.parse(readFileSync(file, "utf8"));
  const paths = files.map((entry) => relative(process.cwd(), resolve(dirname(file), entry)).split(sep).join("/"));
  for (const prefix of required) {
    if (!paths.some((entry) => entry.startsWith(prefix) && entry.endsWith(".json"))) throw new Error(`${file}: missing required ${prefix}`);
  }
  const unwanted = paths.find((entry) => ["public/", "src/content/editorial/", "docs/", "tests/", "output/"].some((prefix) => entry.startsWith(prefix)));
  if (unwanted) throw new Error(`${file}: unnecessary file ${unwanted}`);
}
console.log(`Function trace check passed (${traces.length} routes).`);
