# Plan — 3 New Big Features

Built in one pass. All three plug into existing state (battle log, player Elo, ranks lib) — no schema changes, no backend calls.

---

## 1. Elo Journey Map (Visual)

**New:** `src/components/EloJourneyMap.jsx`, `src/lib/journeyMap.js`, styles in `src/index.css`.

A horizontally scrollable SVG "world map" rendering the current season's battle log as a winding trail through tier biomes.

- **Biomes per tier** (full-height vertical bands, drawn as SVG gradients + decorative layers):
  - Bronze → canyon (ochre cliffs, dust)
  - Silver → tundra (icy plains, snow)
  - Gold → savanna (dunes, sun rays)
  - Diamond → glacier (crystal shards, aurora)
  - Mythic → nebula (starfield, purple gas clouds)
  - Legendary → volcanic (lava rivers, ember particles)
  - Masters → obsidian ruins (cracked stone, red lightning)
  - Pro → celestial throne (gold halo, crown motifs)
- **Trail:** SVG `<path>` generated from battle Elo history using a Catmull–Rom smoothed spline. Path Y = Elo normalized within biome band; path X = battle index. Path stroke is a gradient matching the biomes it crosses.
- **Battle markers:** small dots on the trail, colored by result (green W / red L). Click → inline expand a `BattleCard`-style popover with brawler, mode, delta.
- **Landmark checkpoints:** flag icons at each rank-up point with the new rank name + Elo.
- **Ravines:** whenever a losing streak ≥3 occurs, the path visibly dips below its natural line with a shaded "canyon" fill underneath.
- **Interaction:** horizontal drag-scroll + wheel; minimap strip at bottom showing the whole journey with viewport indicator.
- Mounted on `Home.jsx` as a collapsible card labeled "Elo Journey Map" between hero and EloProgressionChart.
- Respects `animPrefs` intensity setting; low-power → static path, no particle layers.

---

## 2. Clutch Index Engine (Logical)

**New:** `src/lib/clutchIndex.js`, `src/components/ClutchBadge.jsx`, `src/components/ClutchIndexCard.jsx`.

Per-battle **Pressure Score (0–100)** = weighted sum of:
- Streak pressure (35%): losing streak length scaled 0→100, winning streak inverse.
- Elo differential (25%): (avgEnemyElo − avgTeamElo) mapped to 0–100.
- Rank-border proximity (25%): distance to nearest tier boundary; ≤75 Elo from demotion = 100.
- Recent form (15%): last-10 win rate below 40% raises pressure.

**Clutch Index** = for battles with Pressure ≥ 60, `(wins / total) × avgPressure`, aggregated across the last 30 rated games.

**Per-battle badge** (added to `BattleLogCard.jsx`):
- Ice veins → win, pressure <30 ("low-stakes win")
- Fire crest → win, pressure ≥60 ("clutch")
- Shattered → loss, pressure ≥60 ("choke")
- No badge otherwise, to avoid noise.

**Profile card** `ClutchIndexCard.jsx` on Home: big number (0–100), verdict label (Ice Cold / Steady / Clutch / Legendary Under Fire), sparkline of pressure vs. result over last 20 games, and 3 highest-pressure recent wins/losses.

Pure functions, memoized against battle log length.

---

## 3. Rank Territory & Threat Assessment (Logical + Visual)

**New:** `src/lib/rankTerritory.js`, `src/components/RankTerritoryMap.jsx`, `src/components/ThreatRadar.jsx`.
**Edit:** `src/pages/Home.jsx` to slot the territory card under the existing `RankScale`. `RankScale` itself is not modified.

**Engine (`rankTerritory.js`):**
- Divides current sub-rank band into 3 zones by Elo position within the band:
  - Danger Zone: bottom 25%
  - Safe Harbor: middle 50%
  - Promotion Front: top 25%
- **Territory Control %** = position-in-band, weighted by recent trend (positive trend adds up to +15%, negative up to −15%, capped 0–100).
- **Threat level:** Safe / Elevated / Critical, derived from zone + trend + streak.
- **Games until demotion** = `distanceToBandFloor / avgLossDelta` (last 15 losses; fallback 25 Elo).
- **Games until promotion** = `distanceToBandCeiling / avgWinDelta`.
- **Trend vector:** slope of last-10-battle Elo regression → advancing / holding / retreating.

**Visual (`RankTerritoryMap.jsx`):**
- Horizontal band of the current sub-rank rendered as territory: three colored zones (red pulsing / neutral / gold shimmering).
- Player marker (glowing dot in current tier color) sits at exact Elo position.
- Labels: "X games to promo" / "Y games to demo".
- Threat pill (Safe / Elevated / Critical) with matching color + subtle screen-edge glow when Critical.

**Stress Radar (`ThreatRadar.jsx`):**
- Small 4-axis radar chart (SVG): Streak, Opponent Strength, Border Proximity, Form.
- Filled polygon in tier color; higher area = more pressure. Reuses values from Clutch Index engine (shared calc) so no duplicate math.

---

## Technical Details

- All three features are pure client-side, reading `battleLog`, `player.currentElo`, `player.highestElo`.
- Shared pressure calc lives in `clutchIndex.js` and is imported by `rankTerritory.js` + `ThreatRadar.jsx` — single source of truth.
- Biome rendering in `EloJourneyMap` uses layered SVG (gradient background + pattern overlay + particle layer via CSS keyframes already present in `index.css`; add only new `.biome-*` classes).
- New CSS keyframes: `aurora-drift`, `ember-rise`, `lava-flow`, `crown-orbit`, `radar-sweep`. All respect `prefers-reduced-motion`.
- Home layout order (new + existing):
  ```text
  Hero / ProfileBadge
  RankScale
  RankTerritoryMap  ← new
  ThreatRadar + ClutchIndexCard (2-col on md+)  ← new
  EloJourneyMap  ← new
  EloProgressionChart
  ... existing sections unchanged
  ```
- No changes to Elo engine, brawlers, spaces, auth, or Supabase.
- No new dependencies; all rendering uses existing `framer-motion` + inline SVG + Tailwind.
