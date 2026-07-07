/**
 * Canvas plumbing: size the backing store to devicePixelRatio so drawing is crisp
 * on retina, and recompute on resize. Returns a context already scaled to CSS
 * pixels, so callers can draw in layout units and ignore DPR.
 */
export interface Stage {
  ctx: CanvasRenderingContext2D;
  width: number; // CSS pixels
  height: number; // CSS pixels
}

export function attachStage(
  canvas: HTMLCanvasElement,
  onResize: (stage: Stage) => void,
): Stage {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");

  const stage: Stage = { ctx, width: 0, height: 0 };

  const resize = (): void => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    stage.width = rect.width;
    stage.height = rect.height;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    onResize(stage);
  };

  window.addEventListener("resize", resize);
  resize();
  return stage;
}
