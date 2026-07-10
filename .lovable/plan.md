## Goal
Bring back the old "grid" battle-card background across every tier and align each tier's particle layer to the exact effects you called out. Core Elo/logic untouched — visuals only.

## Note on plan cadence
Locking in your rule: **I only draft a "new upgrades / features" plan when you explicitly say "Plan new stuff".** This plan is purely the visual restore.

## 1. Shared grid backdrop
Add a reusable `GridBackdrop` layer inside `src/components/TierAuraOverlay.jsx` that renders **under** every tier's particles:
- Two crossed `linear-gradient` stripes forming a ~24px square grid.
- Line color = tier accent at 12–18% opacity, plus a subtle vignette so edges darken.
- Sits above the base gradient, below particles → grid is always visible, doesn't fight readability.
- Skipped automatically in low-power mode (kept as flat gradient we already ship).

## 2. Per-tier particle spec (matches your list)
| Tier | Keep | Change / add |
|---|---|---|
| Bronze | brick base + diagonal bullets | grid overlay tinted amber |
| Silver | lightning bolts + sheen | grid overlay tinted slate; slight flash dim so bolts pop |
| Gold | pop-up shiny stars | grid overlay tinted gold; add faint sparkle trails |
| Diamond | wind whooshes | grid overlay tinted cyan; add small drifting "wind" particles |
| **Mythic** | purple base | **replace bottom fire with big purple explosion bursts** (flash + shockwave ring + violet debris every 1.8–2.6s) |
| Legendary | orange fire + bolts | keep, add occasional explosion burst; grid tinted red |
| **Masters** | flash + generic debris | swap grey squares for **debris "chunk" icons** (small SVG rock shapes with rotation) |
| **Pro** | current gold burst | **golden crown particles** flying up + fading (SVG crown, 2–3s cadence), on grid tinted gold |

## 3. Files touched
- `src/components/TierAuraOverlay.jsx` — add `GridBackdrop`, rewrite `MythicAura` (explosions), `MastersAura` (chunk SVG), `ProAura` (crown SVG particles), wire grid into each tier.
- `src/index.css` — new keyframes: `mythic-blast`, `mythic-ring`, `pro-crown-rise`, `masters-chunk-spin`; reuse existing bullet/bolt/star keyframes.
- No changes to `BattleLogCard.jsx`, `BattleCard.jsx`, or any logic file.

## 4. Perf & a11y
- All new layers respect the existing `useLowPowerMode()` guard (reduced-motion, low cores/RAM, narrow screens fall back to the static gradient — no grid, no particles).
- Particle counts capped (≤6 per effect) to keep GPU cost flat.

## 5. Verification
- `bun run build` succeeds.
- Playwright screenshot of Home with battle cards across at least Bronze / Diamond / Mythic / Pro to confirm grid + new particles render and don't obscure text.
