# Animations + Battle Log Logic + Path to Pro Overhaul

## 1. Path to Pro — from flat strip to a real journey

Current state: horizontal row of 53 circular nodes on a per-tier gradient band with one static SVG scenery layer per tier. It reads flat because every node is the same size on one straight line, scenery sits behind everything at one depth, and there is no sense of travel.

Changes:

1. **Serpentine path, not a straight line.** Nodes follow a gentle vertical sine offset (±26px) along the scroll, connected by a curved SVG trail behind them instead of implicit spacing. Reached segments render as a glowing solid trail in tier colors; unreached segments as a dim dashed trail.
2. **Parallax depth.** Split each biome into 3 layers (far sky, mid silhouettes, near ground props) that translate at different speeds as the container scrolls — real depth instead of a flat backdrop.
3. **Node hierarchy.** Major-rank nodes get 1.5x size, a rotating conic aura ring and a pedestal shadow; sub-rank nodes shrink and lose their label until hovered. Kills the "wall of identical circles" look.
4. **Traveler marker.** An animated avatar puck sits on the current Elo position, bobbing, with a trailing comet tail, and the map auto-scrolls to it (existing behavior kept).
5. **Milestone flags.** Every tier boundary gets a planted banner in tier colors with the tier name, so the eye has anchors while scrolling.
6. **Biome transitions.** Adjacent bands cross-fade through a 40px gradient seam instead of a hard edge.
7. **Progress HUD.** Sticky top-left chip: current tier, % to next major rank, and checkpoints cleared (e.g. "31 / 53").
8. **Perf + a11y.** All new motion respects `prefers-reduced-motion` and the existing `animPrefs` intensity setting (low = static scenery, no parallax).

## 2. Animation upgrades (battle cards + global)

- **Tier FX pass 3** in `TierAuraOverlay.jsx`: add per-tier signature "impact" burst played on card reveal (Bronze shell casings, Silver arc flash, Gold coin shower, Diamond frost shards, Mythic void bloom, Legendary ember cyclone, Masters shockwave debris, Pro crown descent).
- **Depth on hover**: cards get a subtle pointer-tracked 3D tilt with a specular sheen sweep, layered over the existing flip.
- **Rank-up moment**: shared burst component reused by `RankUpAnimation` so promotions and card reveals feel like the same visual language.
- All new keyframes go in `src/index.css` and scale with `intensityScale()`; low-power mode and reduced-motion drop to a plain fade.

## 3. Battle log logic upgrades

Verified in `src/lib/battleLog.js`: load/backup recovery, add/edit cascade with anti-farm forwarding, delete rebuild, and per-participant manual deltas all work. Remaining gaps to close:

- `deleteBattle` re-applies stored `delta` values verbatim instead of recalculating non-manual entries, so deleting an old battle leaves stale deltas downstream. Rebuild it to use the same `calculateElo` cascade `editBattle` uses (manual entries keep their fixed delta).
- `addManualAdjustment` writes no `manualTeammateDeltas` / `manualEnemyDeltas` and no `eloDetails`; normalize its entry shape so downstream analytics (Brawler Lab, Season Vault, Clutch Index) never hit undefined fields.
- Add a single `recomputeLog(log, startIndex)` helper so add / edit / delete all share one cascade implementation instead of three near-copies.
- Add safety-net floors into the cascade path so recalculated history can't dip a Diamond+ player below their permanent floor.
- Add a lightweight integrity check on load: drop entries missing `id`/`timestamp`, dedupe repeated ids, and keep the log sorted newest-first.

## Technical notes

- Files touched: `src/components/EloJourneyMap.jsx` (major rewrite), `src/components/TierAuraOverlay.jsx`, `src/components/RankUpAnimation.jsx`, `src/index.css`, `src/lib/battleLog.js`.
- No new dependencies, no backend or schema changes.
- Path to Pro stays a single scroll container so mobile behavior and auto-scroll are unchanged.
