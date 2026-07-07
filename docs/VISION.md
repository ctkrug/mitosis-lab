# Mitosis Lab — Vision

## The problem

"Simulations" on the web are usually generic particle systems: dots that attract,
repel, and swirl with no meaning behind them. They look busy but say nothing. At
the same time, the one place a branching, growing structure genuinely *means*
something — biology's **cell lineage** — is normally locked inside static textbook
diagrams or heavyweight research tools. There's no fun, tactile way to *play* with
the process and feel how the rules produce the tree.

## The core idea

Mitosis Lab makes one real biological process interactive:

1. A single **seed cell** exists at time zero.
2. Each cell divides after a **stochastic interval** — timing drawn from a mean
   with jitter, because real cells don't divide on a metronome.
3. On division, each daughter inherits a **mutated copy** of its mother's genome
   (hue, size, division bias). Traits *drift*, so mutations form visible lineages.
4. Run it forward and a **lineage tree** grows — the exact structure biologists use
   to trace ancestry — and you watch it branch live.

The knobs (mutation rate, mean division interval, timing jitter, population cap)
let you *see* cause and effect: crank mutation and the tree turns into a riot of
colour lineages; tighten jitter and divisions march in synchronised waves.

## Who it's for

- Curious people who like generative/simulation toys and want one with real depth.
- Students and educators who want an intuition pump for stochastic division and
  heredity that beats a static diagram.
- Portfolio viewers who should immediately read "this person models real systems
  with taste," not "another bouncing-balls demo."

## Key design decisions

- **Pure simulation core, separate from rendering.** `src/sim/` is deterministic
  and fully unit-tested; the Canvas layer only draws. Correct biology is provable
  without a browser.
- **Seeded determinism.** Every run is a pure function of `(seed, params)`; the
  seed lives in the URL so a striking run can be shared exactly.
- **Canvas over SVG.** A lineage can reach hundreds of nodes; an immediate-mode
  Canvas renderer at `devicePixelRatio` keeps it at 60fps where SVG would choke.
- **Real biology, honestly bounded.** We model stochastic timing and trait
  inheritance faithfully, but cap population and abstract away metabolism — the
  goal is an intuition pump, not a research-grade model, and we say so.
- **Static, self-contained, relative paths.** Builds to one `dist/` directory with
  no server, hostable under any base path.

## The wow moment

Press play on a single dim cell and watch it **bloom into a living, branching
lineage tree** — nodes popping into being with a soft synth blip, branches sweeping
outward, mutation-coloured sub-lineages fanning across the canvas — all in real
time, all reshaping the instant you drag a slider.

## What "v1 done" looks like

- A seed cell grows into a smoothly-animated radial lineage tree at 60fps.
- Sliders for mutation rate, mean division interval, jitter, and max population
  visibly and immediately change the tree.
- Play / pause / step / reset and a speed control all work.
- A seed field makes runs reproducible and is reflected in the URL for sharing.
- Live readouts (population, generation, divisions, mutations) update like a lab
  instrument.
- Synth SFX on division with a persistent mute toggle; `prefers-reduced-motion`
  respected.
- The page follows `docs/DESIGN.md` end to end: fills the viewport, styled
  controls, favicon, designed win/empty states — passes the design ship gate.
- CI green (typecheck + tests + build); deployable to
  `apps.charliekrug.com/mitosis-lab`.
