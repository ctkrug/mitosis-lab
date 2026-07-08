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

## Features

- **Live lineage tree** — a single seed cell blooms into a branching genealogy,
  laid out as a radial dendrogram and drawn on Canvas with smooth birth tweens
  as new divisions land.
- **Biology you can tune** — sliders for mutation rate, mean division interval,
  timing jitter, and max population; the tree responds live.
- **Inherited traits** — each cell carries a small genome (hue, size, division
  bias) that drifts on division, so mutations are visible as colour/shape lineages.
- **Deterministic + shareable** — a seed field makes any run reproducible; the seed
  and every biology parameter live in the URL so a run can be shared exactly.
- **Playback control** — play / pause / step / reset, and a speed control from slow
  study to fast-forward.
- **Readouts** — live population, generation depth, division count, and a mutation
  tally, styled like a lab instrument.
- **Feedback** — a mother pulse + expanding ring on every division, an mCherry
  flare on mutated daughters, synth SFX with a persistent mute, and a
  colony-saturated celebration overlay when the population cap is hit.
- **Auto-fit camera** — the view zooms/pans to keep the whole growing tree in
  frame without any input.

- **Landing page** — `site/` shares the app's brand and tokens, with its own
  live/looping preview (a real, headless run of the same sim + renderer) and a
  "Launch the lab" CTA into the app.

## Stack

- **TypeScript** — strict, no runtime deps.
- **HTML5 Canvas** — hand-rolled renderer at `devicePixelRatio` for crisp retina.
- **Vite** — dev server + static build to `dist/` (relative asset paths, hostable
  under any base path).
- **Vitest** — unit tests for the simulation core (RNG, division, inheritance)
  and every pure "app math" module (radial layout, camera fit, URL/param
  parsing, tween/timestep helpers).

The simulation core is deliberately separated from rendering: it's pure,
deterministic, and fully unit-tested, so the biology is correct independent of
the pixels. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full
module map and data flow.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # run the simulation unit tests
npm run build    # static bundle in dist/
```

## Status

All 17 backlog stories across all 4 epics are built, unit-tested, and verified
in a real browser (resize/focus/contrast pass, plus a full played-through run).
See [`docs/VISION.md`](docs/VISION.md) for the plan,
[`docs/BACKLOG.md`](docs/BACKLOG.md) for the epic/story breakdown (with
verification notes per story), [`docs/DESIGN.md`](docs/DESIGN.md) for the art
direction, and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the module map.

## License

MIT — see [`LICENSE`](LICENSE).
