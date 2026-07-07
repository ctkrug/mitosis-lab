# Mitosis Lab

[![CI](https://github.com/ctkrug/mitosis-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/ctkrug/mitosis-lab/actions/workflows/ci.yml)

**An interactive cell-lineage simulator.** Seed a single cell, tune its biology —
mutation rate, division timing, division jitter — and watch a living lineage tree
branch and grow in real time. Every node is a cell; every fork is a division;
every colour shift is an inherited mutation propagating down the family.

> Not a generic particle system. Mitosis Lab models an actual biological process:
> stochastic division timing (cells don't divide on a metronome) and inherited,
> drifting traits (daughters resemble their mother, plus noise). What you watch is
> a genealogy, not confetti.

## The idea

A cell divides after a randomised interval, hands each daughter a slightly mutated
copy of its trait genome, and the two daughters go on to divide themselves. Run
that forward and you get a branching tree — the same structure biologists draw as a
*lineage tree*. Mitosis Lab draws it live, so you can *see* how a knob like
"mutation rate" reshapes an entire population's history.

## Planned features

- **Live lineage tree** — a single seed cell blooms into a branching genealogy,
  drawn on Canvas at 60fps with smooth growth as new divisions land.
- **Biology you can tune** — sliders for mutation rate, mean division interval,
  timing jitter, and max population; the tree responds immediately.
- **Inherited traits** — each cell carries a small genome (hue, size, division
  bias) that drifts on division, so mutations are visible as colour/shape lineages.
- **Deterministic + shareable** — a seed field makes any run reproducible; the seed
  lives in the URL so a run can be shared exactly.
- **Playback control** — play / pause / step / reset, and a speed control from slow
  study to fast-forward.
- **Readouts** — live population, generation depth, division count, and a mutation
  tally, styled like a lab instrument.

## Stack

- **TypeScript** — strict, no runtime deps.
- **HTML5 Canvas** — hand-rolled renderer at `devicePixelRatio` for crisp retina.
- **Vite** — dev server + static build to `dist/` (relative asset paths, hostable
  under any base path).
- **Vitest** — unit tests for the pure simulation core (RNG, division, inheritance).

The simulation core is deliberately separated from rendering: it's pure,
deterministic, and fully unit-tested, so the biology is correct independent of the
pixels.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # run the simulation unit tests
npm run build    # static bundle in dist/
```

## Status

Early scaffold. See [`docs/VISION.md`](docs/VISION.md) for the plan,
[`docs/BACKLOG.md`](docs/BACKLOG.md) for the epic/story breakdown, and
[`docs/DESIGN.md`](docs/DESIGN.md) for the art direction.

## License

MIT — see [`LICENSE`](LICENSE).
