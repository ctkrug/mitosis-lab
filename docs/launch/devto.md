---
title: "Building Mitosis Lab: a reproducible cell-lineage simulator in the browser"
published: false
tags: typescript, canvas, dataviz, webdev
---

I wanted to see, not read about, how a single knob like "mutation rate" reshapes
an entire population's history. So I built [Mitosis Lab](https://apps.charliekrug.com/mitosis-lab/),
a small TypeScript and Canvas toy: seed one cell, tune its biology, and watch a
lineage tree branch and grow in real time. It is open source and has no runtime
dependencies. Here are the two decisions that made it work.

## 1. A pure simulation core, separated from every pixel

The rule I set early: `src/sim/` never imports from the rendering layer and never
touches the DOM or `Math.random()`. A run is a pure function of its seed and
parameters. That constraint paid for itself twice.

First, it makes the biology testable without a browser. The division scheduler,
the trait-inheritance step, and the mutation tally are all plain functions I can
assert on directly, so the core sits at 96% coverage while the Canvas glue stays
thin and mostly untested by design.

Second, it makes runs shareable. Randomness comes from a seeded mulberry32 PRNG,
so the same seed always produces the same tree. The seed and every parameter live
in the URL query string, which means a striking colony is one copied link away
from being reproduced exactly by whoever opens it.

The catch is frame rate. `requestAnimationFrame` hands you a variable delta, and
if you feed that straight into the simulation, two machines running the same seed
diverge because they took different-sized time steps. The fix is a fixed-timestep
accumulator: bank the real elapsed time each frame and advance the sim in fixed
1/30-second increments, so the sequence of division events is identical whether
the page renders at 30fps or 144fps.

## 2. A radial layout that never overlaps itself

The tree is drawn as a radial dendrogram. Each generation is a ring further out,
and a node's angular slice is split among its children in proportion to how many
leaves each child's subtree contains. Weighting by leaf count is what keeps
sibling subtrees from ever colliding, no matter how lopsided the growth gets.

Computing those weights is cheap because of an invariant the simulation already
guarantees: cells are only ever appended, in birth order, so a parent always sits
earlier in the array than its children. That lets a single reverse pass compute
every subtree weight bottom-up in O(n), no recursion or extra bookkeeping needed.

## The bug I enjoyed most

Clicking Play sometimes did nothing. It turned out the button rebuilt its own SVG
icon via `innerHTML` on every state change, including an unconditional one fired
on reset. A browser only dispatches `click` if the element that received
`mousedown` is still connected at `mouseup`. Typing a seed and immediately
clicking Play let the seed field's blur event rebuild the button's child node
between the press and the release, and the click was silently dropped. The fix
was a one-line guard: skip the rebuild when the requested state already matches
what is shown. The broader lesson stuck with me. Any clickable element whose
contents get reassigned from application state, not just from interaction with
that element, is at risk of eating its own click.

## What I would do differently

The renderer is stateful and does its own tweening, camera damping, and ripple
bookkeeping. It works and it is fast, but if I extended this I would pull that
animation state into a small structured layer instead of letting it accrete
inside one `render` method. I would also add pan and zoom so you can inspect a
single branch of a large colony, which the auto-fit camera currently makes hard.

Code and a full architecture write-up are on
[GitHub](https://github.com/ctkrug/mitosis-lab). The live version is at
[apps.charliekrug.com/mitosis-lab](https://apps.charliekrug.com/mitosis-lab/).
Press play and turn the mutation rate up.
