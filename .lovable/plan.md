# Plan — Battle Card Polish, Rank Meme Titles, Simulator Fix

## 1. Bug fix — Rank-Up Simulator breaks after "New Season"

**Root cause candidates found in `handleResetSeason` (`src/pages/Home.jsx:178`) + `simulateWinShare` (`src/lib/rankUp.js:172`):**
- After reset, `player.currentElo` drops (e.g. 750) but `player.highestElo` stays high → `predictBattles` uses the old highestElo which is far above currentElo, causing lopsided deltas.
- The Diamond+ floor line `Math.max(3000 <= player.currentElo ? 3000 : 0, ...)` is fine at 750, but if `player.currentElo` ever transiently becomes `undefined`/`NaN`, `getRank(NaN)` returns undefined → `result.projectedRank.tier` throws → white simulator card.
- Slider retains previous `total`/`wins` state; if `wins > total` after a re-render race, the slider prop errors.

**Fix:**
- Harden `simulateWinShare`: coerce `currentElo`, `highestElo`, `winRate` to numbers with fallbacks; if invalid return a safe zero-delta result.
- Harden `RankUpSimulator.jsx`: guard `result.projectedRank`, `currentRank`, `cCur`, `cNew` with fallbacks to Bronze tokens; wrap in a small error boundary so it never blanks the Home page.
- In `handleResetSeason`, also reset `teamElos`/`teamProfiles` staleness by keeping them but re-syncing `highestElo` for simulation purposes (do NOT overwrite the lifetime peak — pass an effective peak = max(currentElo, currentSeasonHighest) into the simulator).
- Clamp slider state on player change: `useEffect([player.currentElo]) → if (wins > total) setWins(total)`.

## 2. New feature — "Rank Meme Title" on the Deserved-Rank / Rank badge

A tongue-in-cheek subtitle that adapts to the player's **highest reached rank this season** (falls back to current tier if no season data).

- New file `src/lib/rankTitles.js` exporting `getRankTitle(rankName, { context })` returning `{ title, subtitle }`.
- One entry per sub-rank (Bronze I → Pro), themed in the BrawlTrack voice. Examples:
  - Bronze I → *"The one who thinks Shelly is broken"*
  - Silver III → *"Randoms enthusiast"*
  - Gold II → *"Gets carried on Heist"*
  - Diamond III → *"Spends 6 hours grinding, never reaches Mythic"*
  - Mythic I → *"Bans Kenji, first-picks Mortis"*
  - Legendary II → *"Actually reads the enemy comp"*
  - Masters → *"You're the reason your teammates tilt"*
  - Pro → *"Touch grass. Please."*
- Context modifiers (optional additive line):
  - On a 5+ win streak → *"…on a heater"*
  - Long loss streak → *"…in a tilt spiral"*
  - Deserved > current by 300 → *"…and underranked"*
- Render locations:
  - `DeservedRankReveal.jsx` — under the tier name, small italic.
  - `RankBadge` header on Home (subtle, one line).
  - Season Report share card (`shareCard.js`) as a footer tagline.

## 3. Battle-card animation upgrades (no core mechanic changes)

Add on top of existing `TierAuraOverlay` effects — all gated by the existing low-power mode:
- **Bronze** — occasional dust puff at the bottom edge (every 3s) to sell the brick vibe.
- **Silver** — after each lightning strike, a subtle screen-shake on the card (2px, 120ms) + a faint white flash overlay at 15% opacity.
- **Gold** — sparkle trail that briefly follows the cursor/tap point on hover.
- **Diamond** — parallax: front-layer whoosh moves faster than a back-layer whoosh for depth.
- **Mythic** — purple embers rise from the fire, fading out at 60% height.
- **Legendary** — heat-haze distortion (CSS `filter: blur(0.4px)` pulsing) over the bottom third.
- **Masters** — camera-shake pulse on each explosion (150ms) + fading shockwave ring.
- **Pro** — crowns rotate slowly while rising; occasional golden confetti burst on rank change.

Shared polish:
- Unify z-index layering (overlay 1 = background, 2 = particles, 3 = content).
- Add `will-change: transform, opacity` on animated nodes.
- Respect the Auto/High/Low toggle already in Settings.

## 4. Logic + polish quick wins

- **Season Momentum Tracker**: after "New Season" reset, show a "Fresh season · 0 logged" state instead of the previous season's chart bleeding through.
- **Rank-Up Checklist**: hide the "Push X more Elo" line if the next rank is a major-tier jump the user hasn't unlocked mechanically (e.g. brawler count req) — instead show the brawler requirement.
- **Anti-Tilt Lock**: after user overrides the lock 3 times in a session, surface a soft reminder card ("You've queued through the lock 3 times — consider a break").
- **Assessment History**: add per-entry delete + clear-all with confirm.
- **Progress bar**: animate the fill on Elo change (400ms spring) instead of snapping.
- **Share card**: include the meme title from feature 2.
- **Rank Reveal**: haptic vibration (mobile) on tier promotion, gated by a Settings toggle.

## 5. Files to create / edit

**Create**
- `src/lib/rankTitles.js`
- `src/components/RankTitleBadge.jsx` (small reusable renderer)

**Edit**
- `src/lib/rankUp.js` — hardened `simulateWinShare`
- `src/components/RankUpSimulator.jsx` — guards + slider clamp effect + local error boundary
- `src/pages/Home.jsx` — pass effective peak, reset Momentum on new season
- `src/components/TierAuraOverlay.jsx` — new sub-effects per tier
- `src/components/DeservedRankReveal.jsx` — render meme title
- `src/components/SeasonEndReport.jsx` + `src/lib/shareCard.js` — tagline
- `src/pages/Settings.jsx` — haptic toggle
- `src/components/AssessmentHistoryPanel.jsx` — delete + clear-all

## Order of work (build phase)

1. Simulator crash fix (highest priority — blocks Home).
2. `rankTitles.js` + integrate on Home + Deserved Rank + Share card.
3. Battle-card animation upgrades.
4. Polish quick wins (Momentum reset, checklist edge case, tilt reminder, history delete, progress bar spring, haptics).
