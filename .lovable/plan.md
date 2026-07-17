# Two New Pages + Battle Log Sanity Pass

## Battle Log Check (findings)

Reviewed `src/lib/battleLog.js` and `src/lib/eloEngine.js` flow. Working correctly:
- `loadBattleLog` has backup-key recovery + trim-on-quota
- `addBattle` passes `battleLog: priorLog` to `calculateElo` (anti-farm rule can fire)
- `computeParticipantTransitions` honors `manualTeammateDeltas` / `manualEnemyDeltas` per participant
- `editBattle` cascades recalculation to newer entries
- `deleteBattle` rebuilds chrono correctly

One small polish to fix in the same pass:
- `editBattle` cascade doesn't forward `battleLog` context to `calculateElo`, so anti-farm rule silently skips on edits. Add prior-slice pass-through.
- `addManualAdjustment` never carries `manualTeammateDeltas`/`enemyDeltas` (harmless but flag as noop for clarity).

No other bugs found — logic is sound.

---

## New Page 1 — Brawler Lab (`/brawler-lab`)

A dedicated brawler-mastery workshop. Right now brawler data is fragmented across Home cards; this consolidates it.

Sections:
1. **Brawler Grid** — every brawler you've logged with a game, sorted by mastery score. Cards show portrait, games played, W/L, avg Elo delta, best mode.
2. **Detail Drawer** — click a brawler → slide-in panel with:
   - Per-mode win-rate breakdown (Gem Grab, Heist, etc.)
   - Best teammates (from `matchupIntel` self-side)
   - Worst enemy matchups (nightmare list)
   - Elo trajectory sparkline while using this brawler
   - "Play This" score (0-100) based on WR, sample size, current meta pressure
3. **Recommendation Banner** — top-3 brawlers to queue right now for climb, factoring current tier, recent losses, and pool depth from the assessment.
4. **Pool Gap Analysis** — how many viable brawlers you have per mode; flags "You have 1 Heist brawler — risky."

Nav: add to the same header row as Season Report / Deserved Rank.

Files:
- `src/pages/BrawlerLab.jsx` (new)
- `src/lib/brawlerLab.js` (new — pure analytics; reuses `matchupIntel`, `battleStats`)
- `src/components/BrawlerLabCard.jsx` + `src/components/BrawlerLabDrawer.jsx` (new)
- Route added in `src/App.jsx`
- Header link added in `src/pages/Home.jsx`

---

## New Page 2 — Season Vault (`/vault`)

A time-machine for past seasons. Currently `SeasonEndReport` shows only the latest season; nothing archives them.

Sections:
1. **Season Cards Wall** — one card per completed season with peak rank, start→end Elo, total games, W/L, MVP brawler. Themed by peak tier.
2. **Compare Mode** — pick any two seasons → side-by-side stat diff (peak, WR%, avg Elo/game, best streak) with green/red delta chips.
3. **Season Timeline** — horizontal ribbon of all seasons stacked, height = peak Elo, colored by peak tier. Click to jump to that season card.
4. **Export** — download a season as PNG (reuse `shareCard.js`) or JSON.

Storage: reuse existing season snapshot system. If snapshots aren't already persisting on season reset, add `saveSeasonSnapshot()` to `src/lib/seasonReset.js` writing to `bt.seasonVault` key. Reads via `src/lib/seasonVault.js`.

Files:
- `src/pages/SeasonVault.jsx` (new)
- `src/lib/seasonVault.js` (new — snapshot save/load/compare)
- `src/components/SeasonVaultCard.jsx` + `src/components/SeasonCompare.jsx` (new)
- Hook into `src/lib/seasonReset.js` to auto-snapshot on reset
- Route added in `src/App.jsx`
- Header link added in `src/pages/Home.jsx`

---

## Battle Log Fix (bundled)

- `src/lib/battleLog.js` → in `editBattle` cascade loop, pass `battleLog: log.slice(i + 1)` to `calculateElo` so anti-farm still applies when editing history.

---

## Technical Notes

- Zero new deps. All analytics reuse existing engines.
- Both pages are lazy-friendly but kept eager for simplicity (small footprint).
- Reduced-motion + `animPrefs` respected in all new components.
- No schema/backend changes.
