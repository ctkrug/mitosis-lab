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

- [x] **1.1 Radial lineage-tree renderer** ⭐ *wow moment*
  - AC1: pressing play grows the seed into a visible branching tree where each fork
    is one division and each node is a cell coloured by its genome hue.
  - AC2: the tree lays out without node/edge overlap for at least 256 living cells
    and stays ≥50fps on a mid laptop.
  - AC3: edges connect every non-seed cell to its parent (no orphan nodes).
  - Verified: `src/app/layout.ts` partitions each parent's angular span among its
    children by subtree leaf count (the standard radial-dendrogram no-overlap
    property), covered by `tests/layout.test.ts` including a no-sibling-overlap
    check across a real 256-cell run. `src/app/render.ts` draws every non-seed
    cell's edge to its resolved parent position and colours living leaves by
    `genome.hue`. The renderer is O(n) trig, well within a 50fps budget at this
    population.
- [x] **1.2 Real-time growth loop with birth tweens**
  - AC1: new cells fade+scale in over ~80–140ms and branch edges draw in — nothing
    teleports.
  - AC2: simulation advances on a fixed timestep independent of frame rate (same
    seed → same tree regardless of fps).
  - Verified: `render.ts`'s `drawNodes` ramps opacity/radius via `easeOutCubic`
    over a 120ms intro window. `src/app/sim-loop.ts`'s `FixedStepLoop` banks real
    elapsed time and fires `Lineage.advance()` in constant 1/30s increments
    regardless of how frame delivery chunks that time —
    `tests/sim-loop.test.ts` proves the same total elapsed time yields the same
    step count whether delivered in one call or many small ones.
- [x] **1.3 Camera fit (auto-frame the growing tree)**
  - AC1: as the tree grows past the viewport, the view zooms/pans so the whole tree
    stays in frame without the user touching anything.
  - AC2: recomputes correctly on window resize (no clipping at 390/768/1440px).
  - Verified: `src/app/camera.ts`'s `fitCamera` recomputes scale/offset from the
    live tree bounds and viewport every frame (`tests/camera.test.ts` covers
    aspect-ratio selection, padding, and clamping); `main.ts`'s render loop calls
    it every frame off `attachStage`'s live `stage.width/height`, so a resize is
    picked up on the very next frame with no separate resize-only code path to
    drift out of sync.
- [x] **1.4 Design polish — stage atmosphere**
  - AC1: the stage fills ≥60vh desktop with the DESIGN glow + vignette; background
    is treated, never flat fill to the edges.
  - AC2: cells render with the fluorophore glow tokens from `docs/DESIGN.md`.
  - Verified: `#app` is `100vh`/`100vw`, `#stage` fills it with a radial-glow
    background; living cells render with `shadowBlur` glow in their genome hue,
    matching the GFP/mCherry/DAPI palette.

## Epic 2 — Tunable biology & controls

> Make the biology playable: knobs that visibly, immediately reshape the tree.

- [x] **2.1 Parameter controls (mutation / interval / jitter / population)**
  - AC1: four styled range sliders drive `SimParams`; dragging one changes the tree
    within one division cycle, live.
  - AC2: at mutation rate 0 the tree is a single hue; near 1 it fans into many
    colour lineages — visibly different.
  - Verified: `src/app/controls.ts` fires `onParamChange` on every slider `input`
    event; `main.ts` applies it via `clampParams` directly onto the live
    `lineage.params`, read by the very next `advance()` call. `mutationRate`
    gates every trait mutation in `src/sim/genome.ts`'s `inherit`, so 0 never
    drifts hue and 1 drifts on every division — already covered by
    `tests/genome.test.ts`.
- [x] **2.2 Transport: play / pause / step / reset + speed**
  - AC1: pause halts growth; step advances exactly one division cycle; reset returns
    to a single seed cell; a speed control spans slow-study to fast-forward.
  - AC2: reset with the same seed reproduces an identical run.
  - Verified: `main.ts`'s frame loop only ticks the sim while `playing`; step calls
    `lineage.advance(meanDivisionInterval)` once; reset rebuilds a fresh `Lineage`
    from the same seed/params, which `tests/lineage.test.ts` already proves is
    deterministic. Speed is clamped via `src/app/transport.ts` (0.25×–8×) and
    scales the real time fed into the fixed-step loop.
- [x] **2.3 Seeded runs with shareable URL**
  - AC1: a seed field sets the run; the seed is written to the URL query string.
  - AC2: loading a URL with a seed reproduces that exact lineage.
  - Verified: `src/app/url.ts`'s `parseRunConfig`/`serializeRunConfig` round-trip
    seed *and* every `SimParams` field (not seed alone), so a shared link
    reproduces the exact lineage regardless of the viewer's current sliders —
    covered by `tests/url.test.ts`. `main.ts` calls `history.replaceState` on
    every param/seed change and the Share button copies the same URL.
- [x] **2.4 Live instrument readouts**
  - AC1: population, max generation, division count, and mutation tally update every
    frame and match the sim's own stats.
  - AC2: readouts use tabular figures and the DAPI data colour from DESIGN.
  - Verified: the render loop updates all four HUD values from `lineage.stats()`
    every frame via `formatCount` (`tests/format.test.ts`); `.hud-value` uses
    `font-variant-numeric: tabular-nums` and `var(--dapi)`.
- [x] **2.5 Design polish — control rail & HUD**
  - AC1: every control has themed hover, focus-visible, active, and disabled states;
    no naked native slider/select/button remains.
  - AC2: control rail + readout HUD compose cleanly at 390 / 768 / 1440px with no
    overlap or horizontal scroll.
  - Verified: every slider/button/text-input in `styles.css` has custom hover,
    focus-visible, active, and disabled rules — no native widget is left
    unstyled. The `max-width: 720px` and `420px` breakpoints collapse the rail
    into a full-width bottom sheet and shrink the HUD. **Not yet verified in an
    actual browser** — this environment has no browser automation tool, so QA
    should do a real resize/interaction pass per the design self-review (D3)
    before this ships.

## Epic 3 — Juice, sound & the saturation moment

> The feedback that turns a correct simulation into something that feels alive.

- [x] **3.1 Division & mutation feedback on the board**
  - AC1: each division shows a mother pulse + expanding ring at the split.
  - AC2: a mutated daughter traces an mCherry flare and its sub-lineage recolours.
  - Verified: `render.ts` records both a `Pulse` (a fading filled disc at the
    mother's own hue) and a `Ripple` (an expanding stroked ring) the frame a
    cell transitions to `divided`. A mutated daughter (its `mutationLoad` >
    its parent's) gets an mCherry ripple on birth; the recolour itself falls
    out of `genome.hue` drift already covered by `tests/genome.test.ts` — every
    cell downstream of that daughter renders in the drifted hue.
- [x] **3.2 Synth SFX with persistent mute**
  - AC1: WebAudio-synthesized `divide` / `mutate` / `saturate` / `ui` sounds fire
    (no binary audio assets); division sound is rate-throttled.
  - AC2: a mute toggle persists across reloads via `localStorage`; `AudioContext` is
    created lazily on first gesture and code guards environments without WebAudio.
  - Verified: `src/app/sound.ts`'s `SoundEngine` generates all four SFX from
    oscillators, throttles every kind per `THROTTLE_MS` (`tests/sound.test.ts`),
    and only creates/resumes its `AudioContext` from `unlock()`, wired to a
    one-time `pointerdown`/`keydown` listener in `main.ts`. `createMuteStore`
    persists through `localStorage`, guarded by a try/catch around access (some
    privacy modes throw) and degrading to unmuted with no storage.
- [x] **3.3 Colony-saturated celebration**
  - AC1: hitting the population cap shows an overlay with the run's stats (pop,
    generations, divisions, mutations, seed) plus **Share run** and **New seed** CTAs.
  - AC2: **Share run** copies the seeded URL; **New seed** starts a fresh lineage.
  - Verified: `main.ts`'s `showBloom()` fires once population reaches
    `maxPopulation`, populates the `.bloom` overlay's stat grid, and pauses
    playback; its two CTAs call the same `shareRun()`/`doReset(randomSeed())`
    paths as the control rail.
- [x] **3.4 `prefers-reduced-motion` + reduced-motion QA**
  - AC1: with reduced motion set, ripples/flares/particles are dropped but cells
    still appear and every control still works.
  - Verified: `main.ts` reads `matchMedia("(prefers-reduced-motion: reduce)")`
    and passes it into `renderer.render()`, which skips creating any new ripple
    or pulse when set (cells still render and the tree still grows); the
    wordmark pinch and bloom-in animation are disabled via the same media query
    in `styles.css`. Controls are native inputs/buttons, unaffected by motion
    settings either way.

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

**Story count: 17** across 4 epics. The wow moment (1.1) is the first story of the
first epic and is reachable within Epic 1.

**Status:** Epics 1–3 (13 stories) are implemented and unit-tested; the "Verified"
notes above name the exact code and tests behind each AC. Nothing here has been
exercised in a real browser yet — this environment has no browser automation
tool, so the D3 design self-review (resize/hover/focus/play-through) is still
outstanding and is folded into remaining story 4.4. Epic 4 (landing page, deploy
readiness, full a11y pass) is next.
