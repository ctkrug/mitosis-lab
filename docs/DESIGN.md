# Mitosis Lab — Design Direction

The art-direction brief. Every BUILD and QA run follows this file; the landing page
(`site/`) and the app (`index.html`) share **one** direction and one set of tokens —
product and page are one brand.

## 1. Aesthetic direction

**Mitosis Lab is a specimen under a darkfield fluorescence microscope: an inky,
near-black biological void where cells glow like fluorophore-stained nuclei and the
lineage tree grows as a luminous dendritic structure.** The palette is lifted
straight from real fluorescence microscopy — **GFP green** for living cells,
**mCherry magenta** for mutations, **DAPI cyan** for data — so the page reads as an
instrument pointed at something alive, not a dashboard.

This is deliberately *not* a warm-paper / blueprint direction (recent portfolio
ships — CVE Radar, Framepick, Statute Watch — went there). It is dark, but it is a
saturated bioluminescent dark with temperature and glow, never "gray cards + one
accent."

## 2. Tokens (actual values)

| Token | Value | Role |
|---|---|---|
| `--bg` | `#060f0d` | specimen void (near-black, green undertone) |
| `--surface-1` | `#0c1a16` | control panel surface |
| `--surface-2` | `#12251f` | raised surface / inputs |
| `--line` | `#1f3a31` | hairline borders |
| `--text` | `#e7f4ee` | primary ink |
| `--muted` | `#7f9c92` | secondary text, labels |
| `--gfp` | `#39f5a8` | **primary accent** — living cells, primary CTA |
| `--mcherry` | `#ff5db1` | **support accent** — mutations, highlights |
| `--dapi` | `#5bd6ff` | data readouts, focus rings |
| `--danger` | `#ff5d6c` | reset / destructive |

- **Type pairing:** display **Space Grotesk** (wordmark, headings, big readouts) +
  UI **IBM Plex Sans** (body, labels, controls), with `system-ui` fallbacks.
  Numeric readouts use tabular figures. Type scale ~1.25 ratio.
- **Spacing:** 8px base scale (4 / 8 / 16 / 24 / 32).
- **Radius:** 14px panels, 8px inputs.
- **Depth:** layered glow — `0 0 24px rgba(57,245,168,0.18)` on live elements, plus
  a soft inner vignette on the stage so the void has depth, never flat fill.
- **Motion:** UI transitions 160–220ms ease-out `cubic-bezier(.22,.61,.36,1)`;
  division/game feedback 80–130ms. Cells fade+scale in on birth, never teleport.

## 3. Layout intent

- **Hero = the stage.** A full-bleed Canvas holding the growing lineage tree gets
  the majority of the viewport (~70% desktop, full-width above the controls on
  phone). The void fills to the edges with a radial glow + vignette — no dead margins.
- **Desktop (1440×900):** stage fills the screen; a translucent, glassy **control
  rail** floats over the left/bottom edge (mutation, interval, jitter, population,
  speed, seed, transport buttons). Live readouts sit top-right like an instrument
  HUD.
- **Phone (390×844):** stage on top (≥55vh), controls in a scrollable sheet below;
  transport (play/pause/step/reset) pinned as a bottom bar with ≥44px targets. No
  horizontal scroll at 390/768/1440.

## 4. Signature detail

**The division bloom + mutation flare.** When a cell divides, the mother pulses and
two daughters *grow* out along the branch with a brief GFP-green ring ripple; when a
daughter carries a mutation, a short **mCherry flare** traces the new branch and the
sub-lineage recolours. The animated wordmark — "MITOSIS" with the "O" as a dividing
cell (two overlapping rings, green + magenta) that slowly pinches — carries the same
idea into the masthead.

## 5. Juice plan (this is a playful toy)

- **Birth tween:** each new cell fades + scales from 0 → full over ~110ms; branch
  edges draw in, they don't snap.
- **Division feedback:** mother pulse + expanding ring on the board at the split.
- **Mutation feedback:** mCherry flare along the mutated branch (pop/pulse).
- **Milestone/celebration:** hitting the population cap ("colony saturated") triggers
  a soft bloom overlay with the run's stats (population, generations, divisions,
  mutations, seed) and a **Share this run** CTA (copies the seeded URL) + **New seed**.
- **Synth SFX (WebAudio, generated in code — zero binary assets):**
  - `divide` — short soft sine "blip" (~440–560Hz), rate-throttled so a burst of
    divisions doesn't machine-gun.
  - `mutate` — brief detuned two-oscillator chirp (magenta's audio twin).
  - `saturate` — low warm swell when the colony caps out.
  - `ui` — tiny tick on transport buttons.
  - Master **mute toggle** persisted in `localStorage`; `AudioContext` created lazily
    on first user gesture; all SFX guarded for environments without WebAudio (tests).
- **`prefers-reduced-motion`:** drop ring ripples / flares / bloom particles, keep
  cells appearing and all function intact.

## 6. Brand assets

- **Favicon** (already scaffolded): inline SVG data-URI — two overlapping rings
  (GFP green + mCherry magenta) on the specimen-black rounded tile. No default globe.
- **Wordmark:** Space Grotesk, tight tracking, the dividing-cell "O"; used in the app
  masthead and the landing hero identically.

## 7. Ship gate reminders (see the shared standard D4)

REJECT if: the stage is a small fixed box in empty space · native unstyled
slider/select/buttons · no interaction states · zero animation or zero sound · broken
at 390px · pure `#000`/`#fff` surfaces · flat treatment-less background · missing
favicon · landing page and app read as different brands.
