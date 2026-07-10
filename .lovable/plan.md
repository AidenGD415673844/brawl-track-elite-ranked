## Phase 1 — do now

### 1. Critical bug & visual fixes

**1.1 Battle log recovery bug**
- `saveBattleLog` in `src/lib/battleLog.js` currently swallows quota errors and trims to 500 silently. Wrap all mutating entry points (`addBattle`, `editBattle`, `deleteBattle`, `addRemoteBattle`, manual adjust) in a single "read → mutate → write → re-read verify" pass that returns the persisted log.
- Add a hydration guard in `Home.jsx`: only write `player`/log to storage after the initial `loadPlayer/loadBattleLog` completes (already partially in place — extend to log). Prevents a race where an empty state overwrites saved logs on hot reload.
- On mount, if `localStorage[ranked_battle_log_v2]` is missing but a stale backup key exists, restore it. Also mirror the log to a second key (`ranked_battle_log_v2.backup`) on every save.

**1.2 Blank page on publish**
- Root cause candidates: (a) `src/api/base44Client.js` shim errors surfacing only in prod, (b) an unguarded top-level throw in `AuthProvider` / `ThemeProvider`, (c) an asset import that resolves in dev but not the built bundle.
- Wrap `<App/>` in an error boundary that renders a visible fallback (so we stop shipping a truly blank page).
- Run `bun run build` and inspect `dist/` for missing chunks; fix any import that references a non-existent file or a `.asset.json` that hasn't been resolved.
- Verify `index.html` mounts `#root` and `main.jsx` imports resolve after build.

**1.3 Background & high-tier animations overhaul**
- Fix `Home.jsx` background container (currently `fixed inset-0` radial that clips under scroll on mobile). Move to a `min-h-dvh` layered gradient on `<body>` via `index.css` with proper `background-attachment: fixed` and a subtle animated aurora.
- Fully rewrite the Mythic / Legendary / Masters / Pro keyframes in `index.css` and their overlays in `TierAuraOverlay.jsx`:
  - **Mythic** — slow cosmic nebula drift + soft violet particle float (no more strobe lightning).
  - **Legendary** — smooth orange/red neon border pulse + orbiting embers (drop the whooshing fire).
  - **Masters** — elegant gold/white radial pulse with slow debris orbit.
  - **Pro** — prismatic sheen sweep + slow rising particles.
- Cadence: 2s cycle, ease-in-out, `will-change: transform, opacity`, respect `prefers-reduced-motion`.

**1.4 Asset verification**
- Enumerate the 23 rank icons under `src/assets/ranks/`, confirm each `.asset.json` resolves, and add a dev-only sanity check in `src/lib/ranks.js` that logs any missing image. Fix any broken references in `RankBadge`, `ProfileBadge`, `RankScale`.

**1.5 CSV + PDF export/import**
- CSV export: unchanged output, but wire a working download on Safari (use `URL.createObjectURL` + anchor with `document.body.appendChild` then `remove`). Confirm click handler in `Home.jsx` isn't blocked by the `themeAccent` border overlay.
- CSV import: extend `parseCSV` to also accept the `=== BATTLE LOG ===` section produced by the exporter, so users can round-trip. Show a toast on success/failure instead of only an inline error.
- PDF export: current `jsPDF` code is fine — add a try/catch and toast, and include battle-log summary + rank progression pages so the button feels meaningful.

---

### 2. Elo engine rewrite (`src/lib/eloEngine.js`)

Full rewrite around your tier table. New pipeline:

1. **Classify match type** by comparing player's sub-rank index to the average enemy sub-rank index:
   - `equal` — same sub-rank
   - `slight` — 1 sub-rank apart
   - `large` — 2+ sub-ranks apart
2. **Base delta from tier table** (equal-battle ranges below are the "equal" band; slight/large scale linearly toward the absolute bounds):

```text
Tier        Equal Win   Equal Loss   Abs Win min/max   Abs Loss min/max
Bronze      100..120    30..50       80 / 200          20 / 100
Silver       90..115    35..55       80 / 200          20 / 100
Gold         85..110    45..70       80 / 200          25 / 120
Diamond      80..110    50..75       75 / 180          30 / 140
Mythic       75..105    50..80       75 / 165          35 / 150
Legendary    70..100    55..90       60 / 150          40 / 165
Masters      70..95     60..100      55 / 140          50 / 185
Pro          65..90     70..110      50 / 130          60 / 250
```

3. **Scaling rule inside the equal band:** use the standard expected-score formula (divisor 400) to map win probability → position inside the tier's equal min/max (favored wins land near the low end, upset wins near the high end; favored losses near the high loss end, upset losses near the low end).
4. **Cross-band scaling:** for `slight` / `large` gaps, extrapolate outward toward the absolute min/max, clamped rigidly to those bounds. `large` upset wins can reach the absolute max; heavily favored losses can reach the absolute max loss.
5. **Underdog bonus:** if the player's sub-rank index is exactly 1 below the enemy avg sub-rank (even by 1 Elo across the boundary), add **+5** to the base delta on both wins and draws for the lower player, and on losses reduce the magnitude by 5 (floor to tier abs min). Applies before final clamp.
6. **Star player / premade / ranked-boost / season-refresh / floor protection:** keep current modifiers but re-apply the tier abs bounds as the *final* clamp so nothing exceeds the table.
7. Include a `details` block explaining which band was used, so the UI can display "Equal-band win", "Upset win", etc.

Testing harness prints Bronze III vs Bronze I, equal battles per tier, and 2-sub-rank upsets/blowouts across Legendary/Masters/Pro, so we can confirm outputs land in-band before shipping.

---

### 3. MUST-DO features

**3.1 Battle-card selector background overhaul (Diamond → Pro)**
- Replace the current empty/broken CSS backgrounds in `TIER_BG`/`TIER_DECOR` for Diamond, Mythic, Legendary, Masters, Pro with rich, layered gradients + subtle static texture so cards read as premium even before the animated overlay plays.
- Slow all card aura animations to a **2s ease-in-out** cycle in `index.css` (currently a mix of 0.8–3s). Reduce particle count, increase blur, add a soft vignette so the card doesn't feel busy.
- Scope changes to `BattleCard.jsx` / `BattleCardGallery.jsx` / `TierAuraOverlay.jsx` / `index.css` only. No engine changes.

**3.2 "What Your Rank Should Be" analyser (new component)**
- New route section on Home: `WhatYourRankShouldBe.jsx`.
- Checklist (all preset toggles / sliders, no free text):
  - Trophies bracket (preset ranges)
  - Current rank (auto-filled from `player.currentElo`)
  - Self-skill 1–10 (already in player)
  - Power 9 / Power 11 counts (already in player)
  - Consistency: current win rate bracket
  - Recent form: last-20 W/L from `battleLog`
  - Premade frequency (solo / duo / trio preset)
  - Star-player rate bracket
  - Best win streak bracket
- Pure deterministic scoring function `computeDeservedRank(player, checklist, battleLog)` in `src/lib/deservedRank.js`:
  - Assigns weighted points to each factor, produces a "true skill Elo".
  - Snaps to the nearest sub-rank via `getRank`.
  - Returns `{ currentRank, deservedRank, delta (sub-rank indices), verdict }` where `verdict` is picked from a preset table:
    - `|delta| ≤ 2` → "You deserve your current rank"
    - `delta > 2` → "You're under-ranked" (preset message per magnitude)
    - `delta < -2` → "You're over-ranked" (preset message per magnitude)
- UI: current rank icon + label on the left, arrow, deserved rank icon + label on the right, preset verdict paragraph below, and a factor breakdown list (each checklist item + how many points it contributed). Styled with the existing Lilita One / card tokens.

---

## Phase 2 — planned, executed on your next turn

Kept here so we agree on scope now but only ship after Phase 1 lands.

- **SHOULD-DO — Season End Report visual upgrade:** cinematic reveal for the equipped tier card (holographic sweep, tier-matched confetti, animated Elo count-up per stat row), staged intro (rank icon → season high → W/L → best streak → equipped card reveal), all reusing existing tier tokens.
- **Battle Log analytics upgrade:** an "Elo momentum" panel — rolling 10-match Elo delta, current variance vs season average, and a per-mode "profit/loss per match" mini table, all derived from existing log data.
- **Ranked rules refresh:** cross-check tier gates, format (Bo1/Bo3), and modifiers against the linked Supercell/Fandom articles and update `getFormatForTier` and rules copy if anything drifted.

Deferred (mentioned in your list, not in scope this pass): promotion-series polish, Elo count-up + streak flames, Win Probability meter in `BattlePredictor`, Bronze/Silver SFX swap, extensions to "What your rank means", additional invented features beyond the 2 MUST-DO ones. Say the word and they go into a Phase 3 plan.

---

## Technical notes

- Files touched Phase 1: `src/lib/battleLog.js`, `src/lib/eloEngine.js` (rewrite), `src/lib/exports.js`, `src/components/CSVImport.jsx`, `src/pages/Home.jsx`, `src/App.jsx` (error boundary), `src/index.css` (backgrounds + high-tier keyframes + 2s cadence), `src/components/TierAuraOverlay.jsx`, `src/components/BattleCard.jsx`, `src/components/BattleCardGallery.jsx`, `src/lib/battleCards.js` (TIER_BG/DECOR for Diamond+), plus new `src/lib/deservedRank.js` and `src/components/WhatYourRankShouldBe.jsx` wired into `Home.jsx`.
- No backend/schema changes. Secrets already present.
- Ranked rules cross-referenced against the Supercell "Ranked is back" post and the Fandom Ranked page while keeping your exact Elo table.