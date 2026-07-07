/**
 * Radial dendrogram layout for the lineage tree — pure, DOM-free.
 *
 * The seed cell sits at the origin; each generation is a ring further out.
 * A node's angular span is partitioned among its children in proportion to
 * their subtree size (leaf count), so sibling subtrees never share angle —
 * the standard radial-dendrogram no-overlap property. Recomputed each frame
 * from the current cell list; cheap enough (O(n)) that this is fine up to
 * the hundreds of cells the simulation caps population at.
 */
import type { Cell } from "../sim/types.js";

export interface LayoutNode {
  id: number;
  x: number;
  y: number;
  angle: number;
  angleStart: number;
  angleEnd: number;
  radius: number;
}

export interface RadialLayoutOptions {
  /** Distance in layout units between one generation's ring and the next. */
  ringSpacing: number;
  /** Angular window the whole tree is drawn into, in radians. */
  angleStart: number;
  angleSpan: number;
}

export const DEFAULT_RADIAL_LAYOUT: RadialLayoutOptions = {
  ringSpacing: 46,
  angleStart: 0,
  angleSpan: Math.PI * 2,
};

/** Compute each node's leaf-count "weight" — internal nodes sum their children. */
function computeWeights(
  cells: Cell[],
  childrenOf: Map<number | null, Cell[]>,
): Map<number, number> {
  const weights = new Map<number, number>();

  // Cells are always appended in birth order, so a parent always precedes its
  // children in the array — a single reverse pass computes weights bottom-up.
  for (let i = cells.length - 1; i >= 0; i--) {
    const cell = cells[i];
    const kids = childrenOf.get(cell.id);
    if (!kids || kids.length === 0) {
      weights.set(cell.id, 1);
    } else {
      let sum = 0;
      for (const kid of kids) sum += weights.get(kid.id) ?? 1;
      weights.set(cell.id, sum);
    }
  }
  return weights;
}

/**
 * Lay out every cell in `cells` as a radial dendrogram, keyed by cell id.
 * Every cell (living or already divided) gets a position, so edges from a
 * divided mother to her daughters — and from any cell to its parent — can
 * always be resolved.
 */
export function computeRadialLayout(
  cells: Cell[],
  opts: Partial<RadialLayoutOptions> = {},
): Map<number, LayoutNode> {
  const { ringSpacing, angleStart, angleSpan } = {
    ...DEFAULT_RADIAL_LAYOUT,
    ...opts,
  };
  const result = new Map<number, LayoutNode>();
  if (cells.length === 0) return result;

  const childrenOf = new Map<number | null, Cell[]>();
  for (const cell of cells) {
    const list = childrenOf.get(cell.parentId);
    if (list) list.push(cell);
    else childrenOf.set(cell.parentId, [cell]);
  }
  const weights = computeWeights(cells, childrenOf);

  const place = (cell: Cell, start: number, end: number): void => {
    const angle = (start + end) / 2;
    const radius = cell.generation * ringSpacing;
    result.set(cell.id, {
      id: cell.id,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      angle,
      angleStart: start,
      angleEnd: end,
      radius,
    });

    const kids = childrenOf.get(cell.id);
    if (!kids || kids.length === 0) return;
    const totalWeight = kids.reduce((s, k) => s + (weights.get(k.id) ?? 1), 0);
    let cursor = start;
    for (const kid of kids) {
      const span = ((end - start) * (weights.get(kid.id) ?? 1)) / totalWeight;
      place(kid, cursor, cursor + span);
      cursor += span;
    }
  };

  const roots = childrenOf.get(null) ?? [];
  if (roots.length === 0) return result;
  const totalWeight = roots.reduce((s, r) => s + (weights.get(r.id) ?? 1), 0);
  let cursor = angleStart;
  for (const root of roots) {
    const span = (angleSpan * (weights.get(root.id) ?? 1)) / totalWeight;
    place(root, cursor, cursor + span);
    cursor += span;
  }

  return result;
}
