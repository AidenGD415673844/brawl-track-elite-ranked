# Plan — Battle Card FX v2, Analytics Trio, Path-to-Pro Biomes

Three bundles, one pass. All client-side, no schema or backend changes.

---

## 1. Battle Card Animation & Background Overhaul

Edit `src/components/TierAuraOverlay.jsx`, `src/lib/battleCards.js`, `src/index.css`.

Per-tier upgrades — each keeps the current base but layers a richer, on-theme motion set. All effects respect `animPrefs` intensity + `prefers-reduced-motion`.

- **Bronze** — brick wall gains subtle mortar shadow depth; bullets get muzzle-flash spark on spawn and a faint smoke trail; add slow-drifting dust motes.
- **Silver** — lightning bolts get a pre-flash white bloom + thunder ripple ring; add rolling storm clouds at top edge.
- **Gold** — star pops now emit a 4-point sparkle cross; add slow-panning sun rays behind the grid; occasional coin-glint flash.
- **Diamond** — whooshes leave a prismatic trail; add slow-floating crystal shards at edges; grid tint gains cyan shimmer band that sweeps every 6s.
- **Mythic** — bottom purple fire gets taller tongues + violet ember rise; add nebula gas cloud drifting behind grid; occasional purple lightning fork.
- **Legendary** — fire + lightning gain a screen-shake-free heat-haze warp; add falling embers that trail red; corner flare-ups on lightning.
- **Masters** — explosions gain shockwave ring + orange flash frame; debris rotates with tumble physics; add cracked-ground vignette pulses.
- **Pro** — crown explosions gain golden confetti burst; add crown-halo orbit ring behind card center; radial god-ray sweep every 8s.

`TIER_BG`/`TIER_DECOR` in `battleCards.js` get richer multi-stop gradients for depth. New CSS keyframes: `muzzle-flash`, `thunder-ring`, `sun-pan`, `prism-sweep`, `nebula-drift`, `heat-warp`, `shockwave`, `god-ray`.

---

## 2. Three New Analytical Features

**New:** `src/lib/matchupIntel.js`, `src/components/MatchupIntelCard.jsx`, `src/lib/eloVelocity.js`, `src/components/EloVelocityCard.jsx`, `src/lib/tiltDetector.js`, `src/components/TiltAlertLive.jsx`.

### a. Matchup Intelligence
Per-brawler-vs-brawler win rate matrix from `battleLog`. Card shows your top 5 favorable and top 5 nightmare matchups with sample size + confidence badge (Low <10 games, Solid 10–25, Strong 25+). Feeds into `BattlePredictor` as a +/- adjustment when the enemy comp is known.

### b. Elo Velocity & Momentum
Rolling window (last 10 / 25 / 50 games) Elo/hour and Elo/game. Sparkline of pace. Detects "acceleration" (velocity trending up 3 windows in a row) or "stall" (flat within ±5 Elo over 15 games). Verdict label: Rocket / Climbing / Cruising / Stalling / Sliding. Estimated time-to-next-rank at current pace.

### c. Live Tilt Detector
Real-time, not passive. Watches last 5 rated battles; if losing streak ≥3 AND avg pressure ≥55 AND Elo dropped ≥60 in last 90 min → surfaces a red "Tilt Detected" banner on Home suggesting a break with a 15-min cooldown timer. Dismissable. Uses shared pressure calc from `clutchIndex.js`.

All three cards live on `Home.jsx` in a new "Insights" section between `ClutchIndexCard` and `EloJourneyMap`. 2-col grid on md+, stack on mobile.

---

## 3. Battle Log Rules & Logic Edits

Edit `src/lib/eloEngine.js`, `src/lib/battleLog.js`, `src/components/BattleLogInput.jsx`.

- **Anti-farm rule**: if the same enemy trio appears 3+ times within 20 minutes, gain is capped at 60% of normal for the 3rd+ encounter. Prevents queue-syncing exploit.
- **Duration sanity check**: matches under 45s that are wins give 70% Elo (likely disconnects); over 8 min give +10% (grind bonus). Configurable in Settings.
- **Rank-gap floor**: if enemy avg Elo is 500+ below yours and you win, minimum +8 Elo (not 0); if you lose, minimum −45 (currently can hit −80). Softens smurf-lobby losses.
- **Manual Δ validation**: reject manual deltas > 200 or < −150 with a confirm prompt ("This is way outside normal range — sure?").
- **Duplicate battle guard**: if identical brawler + result + timestamp within 30s of previous entry, prompt "Looks like a duplicate — add anyway?".

All rules toggleable in Settings under a new "Battle Log Rules" section (default: all ON except duration sanity which is OFF).

---

## 4. Path to Pro — Biome Backgrounds

Edit `src/components/EloJourneyMap.jsx`, add CSS to `src/index.css`.

Each of the 8 themed segments gets on-theme scenery drawn as SVG layers behind the path (parallax-lite: slower scroll than nodes):

- **Bronze (0–750)** — desert canyon: cacti silhouettes, tumbleweeds rolling slowly, distant mesa layers, bullet casings on the ground.
- **Silver (750–1500)** — snowy tundra: pine trees with snow caps, falling snowflakes, aurora ribbon overhead, ice patches on the path.
- **Gold (1500–3000)** — savanna: acacia trees, tall grass swaying, sun rays, golden coin piles at rank nodes.
- **Diamond (3000–4500)** — glacier peaks: crystal spires, floating ice shards, aurora, snow drift.
- **Mythic (4500–6000)** — nebula/void: floating asteroids, star clusters, purple gas clouds, portal rings around nodes.
- **Legendary (6000–7500)** — volcanic: lava rivers along path edges, ember rise, ash palms, cracked obsidian ground.
- **Masters (7500–10750)** — obsidian ruins with lava fissures; brightens through Masters II → III (opacity of glow layers ramps).
- **Pro (11250–15000)** — celestial throne: floating gold crowns, halo rings, cloud sea, god-rays; brightest tier.

Trophy-road feel: scenery sized so it frames the path without covering nodes; nodes stay foreground with strong contrast. All scenery is inline SVG (no new assets), respects reduced-motion, and low-intensity mode strips parallax + particles.

---

## Technical Notes

- No new deps.
- All animation intensity controlled via existing `useAnimPrefs()`.
- Shared calcs stay in `clutchIndex.js` and `battleStats.js` — new engines import, not duplicate.
- Home layout after changes:
  ```text
  Hero / RankScale / RankTerritoryMap
  ThreatRadar + ClutchIndexCard
  Insights: MatchupIntel + EloVelocity  ← new
  TiltAlertLive banner (conditional)     ← new
  EloJourneyMap (Path to Pro w/ biomes)  ← upgraded
  ... existing sections unchanged
  ```
- Settings gains "Battle Log Rules" toggles section.
