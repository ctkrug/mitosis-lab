/**
 * Render a static SVG snapshot of a real Mitosis Lab run — same simulation and
 * radial layout the app uses — for the README and landing page, where a live
 * canvas can't run. Deterministic (fixed seed + params), so re-running it
 * reproduces byte-identical output.
 *
 *   npx vite-node scripts/render-sample.ts
 */
import { writeFileSync } from "node:fs";
import { Lineage } from "../src/sim/lineage.js";
import { computeRadialLayout } from "../src/app/layout.js";
import { boundsOfPoints } from "../src/app/camera.js";

const SEED = "portfolio";
const PARAMS = {
  mutationRate: 0.55,
  meanDivisionInterval: 2.0,
  divisionJitter: 0.4,
  maxPopulation: 220,
};

const lineage = new Lineage(SEED, PARAMS);
// Advance well past saturation so the tree is a full, settled colony.
lineage.advance(400);
const cells = lineage.cells;
const layout = computeRadialLayout(cells);
const nodes = [...layout.values()];
const bounds = boundsOfPoints(nodes);

const PAD = 28;
const minX = bounds.minX - PAD;
const minY = bounds.minY - PAD;
const w = bounds.maxX - bounds.minX + PAD * 2;
const h = bounds.maxY - bounds.minY + PAD * 2;

const n = (v: number): string => Math.round(v * 100) / 100 + "";

const edges: string[] = [];
for (const cell of cells) {
  if (cell.parentId === null) continue;
  const from = layout.get(cell.parentId);
  const to = layout.get(cell.id);
  if (!from || !to) continue;
  edges.push(
    `<line x1="${n(from.x)}" y1="${n(from.y)}" x2="${n(to.x)}" y2="${n(to.y)}"/>`,
  );
}

const halos: string[] = [];
const cores: string[] = [];
for (const cell of cells) {
  if (cell.divided) continue; // only living leaves render as glowing nuclei
  const node = layout.get(cell.id);
  if (!node) continue;
  const r = 4 + 4 * cell.genome.size;
  const color = `hsl(${n(cell.genome.hue)} 88% 62%)`;
  halos.push(
    `<circle cx="${n(node.x)}" cy="${n(node.y)}" r="${n(r * 2.1)}" fill="${color}" opacity="0.16"/>`,
  );
  cores.push(
    `<circle cx="${n(node.x)}" cy="${n(node.y)}" r="${n(r)}" fill="${color}"/>`,
  );
}

const stats = lineage.stats();
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${n(minX)} ${n(minY)} ${n(w)} ${n(h)}" width="${Math.round(w)}" height="${Math.round(h)}" role="img" aria-label="A Mitosis Lab lineage tree: ${stats.population} living cells across ${stats.maxGeneration} generations, grown from seed &quot;${SEED}&quot;.">
  <defs>
    <radialGradient id="void" cx="50%" cy="42%" r="70%">
      <stop offset="0%" stop-color="#0b1a15"/>
      <stop offset="100%" stop-color="#060f0d"/>
    </radialGradient>
  </defs>
  <rect x="${n(minX)}" y="${n(minY)}" width="${n(w)}" height="${n(h)}" fill="url(#void)"/>
  <g stroke="rgba(127,156,146,0.4)" stroke-width="1.1" fill="none">
    ${edges.join("\n    ")}
  </g>
  <g>
    ${halos.join("\n    ")}
  </g>
  <g>
    ${cores.join("\n    ")}
  </g>
</svg>
`;

writeFileSync("docs/sample-lineage.svg", svg);
console.log(
  `wrote docs/sample-lineage.svg — ${stats.population} living / ${stats.totalCells} total cells, gen ${stats.maxGeneration}`,
);
