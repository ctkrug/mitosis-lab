/**
 * Entry point — "hello it runs" bootstrap.
 *
 * Wires a Lineage to the canvas and runs a real-time loop that advances the
 * simulation and draws living cells as glowing nuclei. The full lineage-tree
 * renderer, controls, and juice arrive in the BUILD phase (see docs/BACKLOG.md);
 * this proves the core loop end-to-end: seed → divide → draw.
 */
import { Lineage } from "../sim/lineage.js";
import { attachStage, type Stage } from "./canvas.js";

const canvas = document.getElementById("stage") as HTMLCanvasElement | null;
if (!canvas) throw new Error("#stage canvas missing");

const lineage = new Lineage("mitosis");
let stage: Stage;

const draw = (): void => {
  const { ctx, width, height } = stage;
  ctx.clearRect(0, 0, width, height);

  // Living cells drift outward from centre by generation — a crude bloom that
  // shows the simulation is alive. The real radial-tree layout lands in BUILD.
  const cx = width / 2;
  const cy = height / 2;
  for (const cell of lineage.cells) {
    if (cell.divided) continue;
    const ring = 18 + cell.generation * 26;
    const angle = (cell.id * 2.399963) % (Math.PI * 2); // golden-angle spread
    const x = cx + Math.cos(angle) * ring;
    const y = cy + Math.sin(angle) * ring;
    const r = 6 * cell.genome.size;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${cell.genome.hue} 90% 62%)`;
    ctx.shadowBlur = 16;
    ctx.shadowColor = `hsl(${cell.genome.hue} 90% 62%)`;
    ctx.fill();
  }
  ctx.shadowBlur = 0;
};

let last = 0;
const frame = (now: number): void => {
  const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
  last = now;
  if (lineage.stats().population < 96) lineage.advance(dt);
  draw();
  requestAnimationFrame(frame);
};

stage = attachStage(canvas, () => draw());
requestAnimationFrame(frame);
