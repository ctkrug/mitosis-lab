# Mitosis Lab — Backlog

Epic / story breakdown for the build. Stories are `[ ]` until a build run implements
them and QA confirms the acceptance criteria. **Acceptance criteria are concrete
checks** — a later run confirms each true or false, not "works well." Every epic
carries a **Design polish** story so design work is scheduled, not an afterthought.

The scaffold already ships the pure simulation core (`src/sim/`: RNG, genome
inheritance, `Lineage.advance`) with unit tests, plus a devicePixelRatio Canvas and
a placeholder bloom renderer. BUILD replaces the placeholder with the real tree.

---

## Epic 1 — The living lineage tree (the wow moment)

> Land the demo first: a single cell blooms into a growing, branching lineage tree
> in real time. Nothing optional gets built before this reads as alive.

- [ ] **1.1 Radial lineage-tree renderer** ⭐ *wow moment*
  - AC1: pressing play grows the seed into a visible branching tree where each fork
    is one division and each node is a cell coloured by its genome hue.
  - AC2: the tree lays out without node/edge overlap for at least 256 living cells
    and stays ≥50fps on a mid laptop.
  - AC3: edges connect every non-seed cell to its parent (no orphan nodes).
- [ ] **1.2 Real-time growth loop with birth tweens**
  - AC1: new cells fade+scale in over ~80–140ms and branch edges draw in — nothing
    teleports.
  - AC2: simulation advances on a fixed timestep independent of frame rate (same
    seed → same tree regardless of fps).
- [ ] **1.3 Camera fit (auto-frame the growing tree)**
  - AC1: as the tree grows past the viewport, the view zooms/pans so the whole tree
    stays in frame without the user touching anything.
  - AC2: recomputes correctly on window resize (no clipping at 390/768/1440px).
- [ ] **1.4 Design polish — stage atmosphere**
  - AC1: the stage fills ≥60vh desktop with the DESIGN glow + vignette; background
    is treated, never flat fill to the edges.
  - AC2: cells render with the fluorophore glow tokens from `docs/DESIGN.md`.

## Epic 2 — Tunable biology & controls

> Make the biology playable: knobs that visibly, immediately reshape the tree.

- [ ] **2.1 Parameter controls (mutation / interval / jitter / population)**
  - AC1: four styled range sliders drive `SimParams`; dragging one changes the tree
    within one division cycle, live.
  - AC2: at mutation rate 0 the tree is a single hue; near 1 it fans into many
    colour lineages — visibly different.
- [ ] **2.2 Transport: play / pause / step / reset + speed**
  - AC1: pause halts growth; step advances exactly one division cycle; reset returns
    to a single seed cell; a speed control spans slow-study to fast-forward.
  - AC2: reset with the same seed reproduces an identical run.
- [ ] **2.3 Seeded runs with shareable URL**
  - AC1: a seed field sets the run; the seed is written to the URL query string.
  - AC2: loading a URL with a seed reproduces that exact lineage.
- [ ] **2.4 Live instrument readouts**
  - AC1: population, max generation, division count, and mutation tally update every
    frame and match the sim's own stats.
  - AC2: readouts use tabular figures and the DAPI data colour from DESIGN.
- [ ] **2.5 Design polish — control rail & HUD**
  - AC1: every control has themed hover, focus-visible, active, and disabled states;
    no naked native slider/select/button remains.
  - AC2: control rail + readout HUD compose cleanly at 390 / 768 / 1440px with no
    overlap or horizontal scroll.

## Epic 3 — Juice, sound & the saturation moment

> The feedback that turns a correct simulation into something that feels alive.

- [ ] **3.1 Division & mutation feedback on the board**
  - AC1: each division shows a mother pulse + expanding ring at the split.
  - AC2: a mutated daughter traces an mCherry flare and its sub-lineage recolours.
- [ ] **3.2 Synth SFX with persistent mute**
  - AC1: WebAudio-synthesized `divide` / `mutate` / `saturate` / `ui` sounds fire
    (no binary audio assets); division sound is rate-throttled.
  - AC2: a mute toggle persists across reloads via `localStorage`; `AudioContext` is
    created lazily on first gesture and code guards environments without WebAudio.
- [ ] **3.3 Colony-saturated celebration**
  - AC1: hitting the population cap shows an overlay with the run's stats (pop,
    generations, divisions, mutations, seed) plus **Share run** and **New seed** CTAs.
  - AC2: **Share run** copies the seeded URL; **New seed** starts a fresh lineage.
- [ ] **3.4 `prefers-reduced-motion` + reduced-motion QA**
  - AC1: with reduced motion set, ripples/flares/particles are dropped but cells
    still appear and every control still works.

## Epic 4 — Ship: landing page, brand & deploy

> One brand across app and page; passes the design ship gate; deployable static.

- [ ] **4.1 Landing page (`site/`) sharing the app's brand**
  - AC1: `site/` uses the same DESIGN tokens/direction and the animated wordmark;
    hero explains the toy with a live/looping preview and a "Launch" CTA.
  - AC2: no placeholder copy; composed and filled at 390 / 768 / 1440px.
- [ ] **4.2 Wordmark & favicon polish**
  - AC1: the dividing-cell wordmark renders in both app masthead and landing hero
    identically; favicon is the in-code SVG monogram, never the default globe.
- [ ] **4.3 Static build + deploy readiness**
  - AC1: `npm run build` emits a self-contained bundle with **relative** asset paths
    that loads correctly from a subpath (e.g. `/mitosis-lab/`).
  - AC2: CI (typecheck + tests + build) is green on `main`.
- [ ] **4.4 Full design self-review (D3) + a11y pass**
  - AC1: resize 390/768/1440 composed; tab order sane with visible focus; icon
    buttons have `aria-label`; status uses a live region; contrast ≥ 4.5:1.
  - AC2: one full run played end-to-end: growth feels instant, sound fires + mute
    persists, saturation celebrates — noted in QA STATUS `memory`.

---

**Story count: 15** across 4 epics. The wow moment (1.1) is the first story of the
first epic and is reachable within Epic 1.
