/**
 * Draws the lineage tree to a 2D canvas context: radial layout + auto-fit
 * camera + birth tweens + division/mutation ripple feedback. Stateful (it
 * has to remember camera position and per-cell birth times across frames)
 * but every number it depends on comes from the pure layout/camera/tween
 * modules, so the interesting math is unit-tested there.
 */
import type { Cell } from "../sim/types.js";
import { computeRadialLayout, type LayoutNode } from "./layout.js";
import { boundsOfPoints, fitCamera, type CameraTransform } from "./camera.js";
import { damp, easeOutCubic, clamp } from "./tween.js";

const BIRTH_TWEEN_MS = 120;
const RIPPLE_MS = { divide: 460, mutate: 620 };
const PULSE_MS = 150;
const CAMERA_LAMBDA = 3.2;

interface Ripple {
  x: number;
  y: number;
  startedAt: number;
  kind: "divide" | "mutate";
}

interface Pulse {
  x: number;
  y: number;
  hue: number;
  baseRadius: number;
  startedAt: number;
}

export interface RenderViewport {
  width: number;
  height: number;
}

export class TreeRenderer {
  private camera: CameraTransform = { scale: 1, x: 0, y: 0 };
  private cameraReady = false;
  private birthAt = new Map<number, number>();
  private divided = new Set<number>();
  private ripples: Ripple[] = [];
  private pulses: Pulse[] = [];
  private lastFrameAt: number | null = null;

  /** Drop all remembered state — call on reset/reseed. */
  reset(): void {
    this.cameraReady = false;
    this.birthAt.clear();
    this.divided.clear();
    this.ripples = [];
    this.pulses = [];
    this.lastFrameAt = null;
  }

  render(
    ctx: CanvasRenderingContext2D,
    cells: Cell[],
    viewport: RenderViewport,
    nowMs: number,
    reducedMotion: boolean,
  ): void {
    const dt = this.lastFrameAt === null ? 0 : (nowMs - this.lastFrameAt) / 1000;
    this.lastFrameAt = nowMs;

    const layout = computeRadialLayout(cells);
    const byId = new Map(cells.map((c) => [c.id, c]));
    this.trackBirthsAndFeedback(cells, byId, layout, nowMs, reducedMotion);
    this.updateCamera(layout, viewport, dt);

    ctx.clearRect(0, 0, viewport.width, viewport.height);
    ctx.save();
    ctx.translate(this.camera.x, this.camera.y);
    ctx.scale(this.camera.scale, this.camera.scale);

    this.drawEdges(ctx, cells, layout);
    this.drawNodes(ctx, cells, layout, nowMs);
    this.drawPulses(ctx, nowMs);
    this.drawRipples(ctx, nowMs);

    ctx.restore();
    this.pruneRipples(nowMs);
  }

  private trackBirthsAndFeedback(
    cells: Cell[],
    byId: Map<number, Cell>,
    layout: Map<number, LayoutNode>,
    nowMs: number,
    reducedMotion: boolean,
  ): void {
    for (const cell of cells) {
      const isNew = !this.birthAt.has(cell.id);
      if (isNew) this.birthAt.set(cell.id, nowMs);
      if (reducedMotion) continue;

      const node = layout.get(cell.id);
      if (!node) continue;

      if (isNew && cell.parentId !== null) {
        const parent = byId.get(cell.parentId);
        if (parent && cell.mutationLoad > parent.mutationLoad) {
          this.ripples.push({ x: node.x, y: node.y, startedAt: nowMs, kind: "mutate" });
        }
      }
      if (cell.divided && !this.divided.has(cell.id)) {
        this.ripples.push({ x: node.x, y: node.y, startedAt: nowMs, kind: "divide" });
        this.pulses.push({
          x: node.x,
          y: node.y,
          hue: cell.genome.hue,
          baseRadius: 5 + 5 * cell.genome.size,
          startedAt: nowMs,
        });
      }
    }
    for (const cell of cells) {
      if (cell.divided) this.divided.add(cell.id);
    }
  }

  private updateCamera(
    layout: Map<number, LayoutNode>,
    viewport: RenderViewport,
    dt: number,
  ): void {
    const target = fitCamera(boundsOfPoints([...layout.values()]), viewport, {
      padding: 80,
    });
    if (!this.cameraReady) {
      this.camera = target;
      this.cameraReady = true;
      return;
    }
    this.camera = {
      scale: damp(this.camera.scale, target.scale, CAMERA_LAMBDA, dt),
      x: damp(this.camera.x, target.x, CAMERA_LAMBDA, dt),
      y: damp(this.camera.y, target.y, CAMERA_LAMBDA, dt),
    };
  }

  private drawEdges(
    ctx: CanvasRenderingContext2D,
    cells: Cell[],
    layout: Map<number, LayoutNode>,
  ): void {
    ctx.lineWidth = 1.4 / this.camera.scale;
    ctx.strokeStyle = "rgba(127, 156, 146, 0.45)";
    ctx.beginPath();
    for (const cell of cells) {
      if (cell.parentId === null) continue;
      const from = layout.get(cell.parentId);
      const to = layout.get(cell.id);
      if (!from || !to) continue;
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
    }
    ctx.stroke();
  }

  private drawNodes(
    ctx: CanvasRenderingContext2D,
    cells: Cell[],
    layout: Map<number, LayoutNode>,
    nowMs: number,
  ): void {
    for (const cell of cells) {
      if (cell.divided) continue; // only living leaves render as glowing nuclei
      const node = layout.get(cell.id);
      if (!node) continue;

      const bornAt = this.birthAt.get(cell.id) ?? nowMs;
      const introT = easeOutCubic(clamp((nowMs - bornAt) / BIRTH_TWEEN_MS, 0, 1));
      const radius = (5 + 5 * cell.genome.size) * introT;
      if (radius <= 0) continue;

      const color = `hsl(${cell.genome.hue} 88% 62%)`;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = introT;
      ctx.shadowBlur = 14;
      ctx.shadowColor = color;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }
  }

  private drawPulses(ctx: CanvasRenderingContext2D, nowMs: number): void {
    for (const pulse of this.pulses) {
      const t = clamp((nowMs - pulse.startedAt) / PULSE_MS, 0, 1);
      if (t >= 1) continue;
      const radius = pulse.baseRadius * (1.6 - 0.6 * t);
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${pulse.hue}, 88%, 62%, ${(1 - t) * 0.6})`;
      ctx.fill();
    }
  }

  private drawRipples(ctx: CanvasRenderingContext2D, nowMs: number): void {
    for (const ripple of this.ripples) {
      const life = RIPPLE_MS[ripple.kind];
      const t = clamp((nowMs - ripple.startedAt) / life, 0, 1);
      if (t >= 1) continue;
      const color = ripple.kind === "divide" ? "57, 245, 168" : "255, 93, 177";
      const radius = 6 + t * 34;
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${color}, ${(1 - t) * 0.8})`;
      ctx.lineWidth = 2.5 / this.camera.scale;
      ctx.stroke();
    }
  }

  private pruneRipples(nowMs: number): void {
    this.ripples = this.ripples.filter(
      (r) => nowMs - r.startedAt < RIPPLE_MS[r.kind],
    );
    this.pulses = this.pulses.filter((p) => nowMs - p.startedAt < PULSE_MS);
  }
}
