import { describe, it, expect } from "vitest";
import { computeRadialLayout } from "../src/app/layout.js";
import { Lineage } from "../src/sim/lineage.js";
import type { Cell, Genome } from "../src/sim/types.js";

const genome: Genome = { hue: 0, size: 1, divisionBias: 1 };

function makeCell(overrides: Partial<Cell> & { id: number }): Cell {
  return {
    parentId: null,
    generation: 0,
    bornAt: 0,
    divideAt: 1,
    divided: false,
    mutationLoad: 0,
    genome,
    ...overrides,
  };
}

describe("computeRadialLayout", () => {
  it("returns an empty map for no cells", () => {
    expect(computeRadialLayout([]).size).toBe(0);
  });

  it("places a lone seed cell at the origin", () => {
    const layout = computeRadialLayout([makeCell({ id: 0 })]);
    const node = layout.get(0)!;
    expect(node.x).toBeCloseTo(0);
    expect(node.y).toBeCloseTo(0);
    expect(node.radius).toBe(0);
  });

  it("places every cell one ring further out per generation", () => {
    const cells = [
      makeCell({ id: 0, generation: 0, divided: true }),
      makeCell({ id: 1, parentId: 0, generation: 1 }),
      makeCell({ id: 2, parentId: 0, generation: 1 }),
    ];
    const layout = computeRadialLayout(cells, { ringSpacing: 50 });
    expect(layout.get(0)!.radius).toBe(0);
    expect(layout.get(1)!.radius).toBe(50);
    expect(layout.get(2)!.radius).toBe(50);
  });

  it("gives every non-root cell a resolvable parent position", () => {
    const lineage = new Lineage("layout-check", { maxPopulation: 40 });
    lineage.advance(1000);
    const layout = computeRadialLayout(lineage.cells);
    expect(layout.size).toBe(lineage.cells.length);
    for (const cell of lineage.cells) {
      expect(layout.has(cell.id)).toBe(true);
      if (cell.parentId !== null) {
        expect(layout.has(cell.parentId)).toBe(true);
      }
    }
  });

  it("partitions a parent's angular span exactly among its children", () => {
    const cells = [
      makeCell({ id: 0, generation: 0, divided: true }),
      makeCell({ id: 1, parentId: 0, generation: 1 }),
      makeCell({ id: 2, parentId: 0, generation: 1 }),
    ];
    const layout = computeRadialLayout(cells, {
      angleStart: 0,
      angleSpan: Math.PI * 2,
    });
    const root = layout.get(0)!;
    const a = layout.get(1)!;
    const b = layout.get(2)!;
    // Children's spans are contiguous and exactly cover the root's span.
    expect(Math.min(a.angleStart, b.angleStart)).toBeCloseTo(root.angleStart);
    expect(Math.max(a.angleEnd, b.angleEnd)).toBeCloseTo(root.angleEnd);
    expect(a.angleEnd).toBeCloseTo(b.angleStart);
  });

  it("gives a larger subtree a proportionally wider angular span", () => {
    // Cell 1 has two living children (weight 2); cell 2 has none (weight 1).
    const cells = [
      makeCell({ id: 0, generation: 0, divided: true }),
      makeCell({ id: 1, parentId: 0, generation: 1, divided: true }),
      makeCell({ id: 2, parentId: 0, generation: 1 }),
      makeCell({ id: 3, parentId: 1, generation: 2 }),
      makeCell({ id: 4, parentId: 1, generation: 2 }),
    ];
    const layout = computeRadialLayout(cells);
    const spanOf = (id: number) => {
      const n = layout.get(id)!;
      return n.angleEnd - n.angleStart;
    };
    expect(spanOf(1)).toBeCloseTo(spanOf(2) * 2, 5);
  });

  it("never overlaps two sibling subtrees' angular ranges", () => {
    const lineage = new Lineage("no-overlap", { maxPopulation: 256 });
    lineage.advance(2000);
    const layout = computeRadialLayout(lineage.cells);

    const byParent = new Map<number, number[]>();
    for (const cell of lineage.cells) {
      if (cell.parentId === null) continue;
      const list = byParent.get(cell.parentId) ?? [];
      list.push(cell.id);
      byParent.set(cell.parentId, list);
    }

    for (const siblingIds of byParent.values()) {
      const spans = siblingIds
        .map((id) => layout.get(id)!)
        .sort((a, b) => a.angleStart - b.angleStart);
      for (let i = 1; i < spans.length; i++) {
        expect(spans[i].angleStart).toBeGreaterThanOrEqual(
          spans[i - 1].angleEnd - 1e-9,
        );
      }
    }
  });
});
