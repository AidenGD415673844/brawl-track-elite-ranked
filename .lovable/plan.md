## Overview

Four workstreams: (1) three new features/upgrades, (2) rebalance the Elo engine, (3) swap Bronze/Silver card+season SFX to your uploaded file, (4) confirm the secrets. Reference used for rules: the Ranked 3.0 support article.

### 0. Secrets — already done ✅
`BRAWL_STARS_API_KEY`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, and `LIVEKIT_URL` are all present in the project's secret store. No action needed — I'll just verify they're readable by the `fetch-battles` and `livekit-token` edge functions.

---

### 1. Three new features / upgrades

**A. New feature — Promotion Series tracker.**
At each major-tier boundary (Bronze→Silver, Gold→Diamond, etc.) show a Best-of-3/Best-of-5 "promo series" widget on Home: animated pip row that fills green/red as you log wins/losses at the boundary, with a "PROMOTED!" burst on success. Pure presentation layer reading existing battle-log data.

**B. Animation upgrade — live Elo delta count-up + streak flames.**
Battle-log cards currently show a static `+/-` number. Upgrade to an animated count-up (framer-motion) with a color pulse, plus an escalating flame/glow on win-streak entries. Also add a subtle screen-edge glow on rank-up in `RankUpAnimation`.

**C. Feature upgrade — Win Probability meter in BattlePredictor.**
Surface the engine's `expScore` as an animated gauge (0–100%) in `BattlePredictor`/`DraftPredictor` so users see predicted win chance and projected Elo swing before logging, reflecting the new, less-swingy curve.

---

### 2. Elo engine rebalance (`src/lib/eloEngine.js`)

Two goals: **less sensitive to rank gaps** (stop tiny gains vs lower enemies) and **steeper losses the higher you climb**.

Current measured behavior:
```text
Bronze III (600) beats Bronze I (100)   -> +9    (too low)
Legendary win/loss/draw  +48 / -55 / 0
Masters   win/loss/draw  +45 / -62 / 0
Pro       win/loss/draw  +43 / -70 / 0
```

Changes:
- **Compress the expected-score curve**: raise the Elo divisor from `400` to ~`700`. This flattens win-probability so a rank gap swings the delta far less — beating weaker enemies still pays fairly.
- **Per-tier minimum win gain / minimum loss**: add a floor so a win is never worth less than a tier-scaled minimum (e.g. Bronze ≥ +28, Silver ≥ +25), fixing the "only gained a few Elo" complaint.
- **Steeper high-rank losses**: increase `K_loss` for Legendary/Masters/Pro and apply a small additional high-tier loss multiplier so demotions bite harder the higher you are.
- Keep wins/losses asymmetric, floors (Bronze–Gold), and Diamond+ boundary protection intact.

Target profile after tuning (approx., final values confirmed by the harness):
```text
Bronze III beats Bronze I   ~ +28..34  (was +9)
Legendary  win/loss/draw    ~ +40 / -70 / 0
Masters    win/loss/draw    ~ +38 / -85 / 0
Pro        win/loss/draw    ~ +35 / -100 / 0
```

**Testing:** I'll run the standalone harness (already prototyped) that calls `calculateElo` for Legendary, Masters, and Pro across victory / defeat / draw, plus the Bronze III-vs-Bronze I case, and paste the before/after numbers so you can confirm the feel before we finalize.

---

### 3. Replace Bronze & Silver SFX (`src/lib/cardSfx.js`)

Your uploaded MP3 (6.87s) becomes the source for **Bronze and Silver only**; all other tiers keep the existing `card_sfx.mp3`.

- Upload the file to the CDN via `lovable-assets` and add an `.asset.json` pointer.
- In `cardSfx.js`, load a second audio element for the new file and route Bronze/Silver playback to it with your timestamps:
  - **Bronze:** 0:01 → 0:02.5
  - **Silver:** 0:03 → 0:05.5
- Gold, Diamond, Mythic, Legendary, Masters, Pro remain on the current file/timestamps.
- This automatically covers both call sites, since `BattleCardGallery` (equip) and `SeasonEndReport` (reveal) both call `playCardSFX(tier)`.

---

### Technical notes
- Files touched: `src/lib/eloEngine.js`, `src/lib/cardSfx.js`, new `src/assets/*.asset.json`, plus components for the three features (`BattleLogCard.jsx`, `RankUpAnimation.jsx`, `BattlePredictor.jsx`/`DraftPredictor.jsx`, and a new `PromotionSeries.jsx` wired into `Home.jsx`).
- No schema/backend changes; secrets already set.
- Elo changes are logic; SFX and the three features stay in the presentation layer.
</content>
<parameter name="summary">Plan: rebalance the Elo engine (less rank-gap sensitivity, steeper high-rank losses, tested across Legendary/Masters/Pro), swap Bronze/Silver card+season SFX to your uploaded file with the given timestamps, add 3 features (Promotion Series tracker, animated Elo count-up/streak flames, Win Probability meter), and confirm the already-set secrets.