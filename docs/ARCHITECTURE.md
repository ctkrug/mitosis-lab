# Mitosis Lab — Architecture

A map of the codebase for whoever (human or a later build/QA pass) picks this up
next. See `docs/VISION.md` for why it exists and `docs/DESIGN.md` for the visual
direction; this file is about how the code is put together.

## Layout

```
src/
  sim/            pure simulation core — no DOM, no Math.random(), fully unit-tested
    rng.ts          seeded mulberry32 PRNG (makeRng, hashSeed)
    genome.ts       trait inheritance (inherit, seedGenome)
    types.ts        Cell / Genome / SimParams / DEFAULT_PARAMS
    lineage.ts      Lineage class: spawn/divide/advance, LineageStats
    index.ts        barrel export — import from "../sim/index.js" outside src/app
  app/            rendering + UI layer — DOM/Canvas-facing, thin and mostly untested
                  by design (the math it calls is tested; the glue isn't)
    tween.ts        clamp/lerp/easeOutCubic/damp — framerate-independent animation
    sim-loop.ts     FixedStepLoop — fixed-timestep accumulator driving Lineage.advance
    layout.ts       computeRadialLayout — pure radial-dendrogram tree layout
    camera.ts       fitCamera/boundsOfPoints — auto-frame the growing tree
    params.ts       PARAM_RANGES/clampParams — single source of truth for slider bounds
    transport.ts    SPEED_RANGE/clampSpeed/formatSpeed — playback speed
    format.ts       formatCount — thousands-separated HUD numbers
    url.ts          parseRunConfig/serializeRunConfig — seed+params <-> query string
    sound.ts        SoundEngine/createMuteStore — synthesized WebAudio SFX
    render.ts       TreeRenderer — draws edges/nodes/birth-tweens/pulses/ripples
    controls.ts     DOM binding for the control rail (queryControls/bindControls)
    canvas.ts       attachStage — devicePixelRatio canvas sizing
    main.ts         entry point: wires everything above together
    styles.css      darkfield-microscopy tokens + layout (docs/DESIGN.md) —
                    single source of the shared tokens; site/ links this file
                    directly rather than duplicating it
site/             marketing landing page — same brand as the app, separate entry
  index.html        hero, "how it works", knobs, CTA band; links ../src/app/styles.css
                    for tokens/wordmark plus its own styles.css for page layout
  styles.css        landing-page-only layout (hero grid, steps, knob cards, footer)
  preview.ts        drives the hero canvas with a real (not decorative) Lineage +
                    TreeRenderer + FixedStepLoop, auto-playing and reseeding on
                    saturation — no controls, sound, or URL state
tests/            one *.test.ts per src/**/*.ts pure module (mirrors the file it covers)
index.html        static shell: canvas stage, wordmark, HUD, control rail, bloom overlay
```

## Data flow

1. **`main.ts`** parses `seed` + `SimParams` from `location.search` (`url.ts`) and
   constructs a `Lineage` (`sim/lineage.ts`).
2. Each `requestAnimationFrame`, while `playing`, `FixedStepLoop.tick()` banks the
   frame's real elapsed time (scaled by the speed slider) and calls
   `lineage.advance(1/30)` once per fixed increment — this is what makes a run
   reproducible independent of frame rate (see `1.2` in `docs/BACKLOG.md`).
3. Every frame, `TreeRenderer.render()`:
   - runs `computeRadialLayout(lineage.cells)` to get each cell's `{x, y}` in
     tree-local space,
   - derives a target camera transform via `fitCamera` and smooths toward it
     with `tween.damp` (never snaps),
   - draws edges, living-cell nodes (with birth fade/scale via `easeOutCubic`),
     division "mother pulses", and division/mutation ripples.
4. `main.ts` also updates the HUD from `lineage.stats()`, plays throttled SFX
   (`sound.ts`) on division/mutation, and shows the colony-saturated bloom
   overlay once population hits `maxPopulation`.
5. Slider/button input flows the other way: `controls.ts` fires callbacks that
   `main.ts` uses to mutate `lineage.params` (via `clampParams`), change `speed`
   (via `clampSpeed`), or rebuild `lineage` entirely (reset/seed change). Every
   param or seed change re-serializes the URL (`serializeRunConfig`) so the
   current run stays shareable.

## Why the sim/app split

`src/sim/` never imports anything from `src/app/` or touches the DOM — every
number a viewer sees is reproducible from `(seed, params)` alone, so the biology
is provable in a test file without a browser. `src/app/` correspondingly pushes
as much *math* as possible (layout, camera, clamping, URL parsing, speed/count
formatting) into small pure functions with their own test file, leaving
`main.ts`/`controls.ts`/`render.ts` as comparatively thin, untested glue — the
DOM/Canvas code that's expensive to unit test and cheap to read directly.

## Run / test / build

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # vitest — pure sim + app-math modules, one file per module
npm run test:coverage  # vitest --coverage
npm run typecheck  # tsc --noEmit (strict)
npm run build      # tsc --noEmit && vite build -> dist/ (relative paths, base: "./")
```

Most modules pair hand-picked example tests with a `fast-check` property test
(e.g. "clampParam always lands in [min, max] for any double, including
NaN/±Infinity") — the invariant classes an example test is most likely to miss.

**Non-finite-input gotcha:** a `<= 0` or `> 0` guard does *not* reject `NaN`
(every NaN comparison is `false`), so it silently lets `NaN` through where a
`Number.isFinite()` guard wouldn't. This bit `FixedStepLoop.tick` (an `Infinity`
elapsed value passed the `> 0` check and permanently wedged the accumulator),
`tween.damp` (a `NaN` dt/lambda passed the `<= 0` check and came out the far
end as `NaN`), and `camera.fitCamera` (a non-finite `viewport.width/height`
flowed straight into the returned `x`/`y` unguarded, even though `scale` and
the bounds centre were already defended). When adding a numeric guard, prefer
`Number.isFinite(x) && x > 0` over bare `x > 0`, and when property-testing a
numeric module, fuzz with `noNaN: false, noDefaultInfinity: false` rather than
`noNaN: true` unless the value is genuinely internal/pre-validated (e.g. a
`fallback` parameter that's always already-clamped).

## Build entries

`vite.config.ts` builds two HTML entries into one `dist/`: `index.html` (the
app, at the root) and `site/index.html` (the landing page, under `dist/site/`).
Both share the same asset graph — `site/preview.ts` imports straight from
`src/sim/` and `src/app/`, so the landing page's hero preview is a real, tiny
run of the actual simulation rather than a separate reimplementation.
