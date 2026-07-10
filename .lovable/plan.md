## Scope

Single-phase polish pass: frequency stars, tier backgrounds, harsher assessment, brawler roster sync, and floor/safety-net audit.

---

### 1. Rank Frequency — 6-star gauge
`src/components/RankFrequencySection.jsx`
- Replace the small tier icon/level effects with a **6-star row per tier** (matching the header stars on the uploaded card).
- Stars are larger (~14–16px). `min(count, 6)` light up in the tier color with a glow; remaining stars stay dim/outlined.
- Keep the count label (`4/6`) under the star row; keep edit mode as-is.
- Levels 1–6 map directly to star count; level 4+ effects (rotating frame) removed to keep the gauge clean.

### 2. Restore Bronze + Silver backgrounds
Root cause: `TIER_BG.Bronze` / `TIER_BG.Silver` are set in `battleCards.js`, but `BronzeAura` paints a heavy brick multiply overlay and `SilverAura` paints a full stormy sheen — both effectively hide the base gradient behind them.
- `src/components/TierAuraOverlay.jsx`
  - `BronzeAura`: lower brick opacity, drop `mix-blend-multiply`, keep diagonal bullets. Add a subtle darker-brown gradient wash inside the aura so the "brick + darker brown" look reads without erasing `TIER_BG`.
  - `SilverAura`: remove the opaque stormy sheen div; keep only the SVG lightning bolts flashing every 0.5–2s.
- `src/lib/battleCards.js`
  - Nudge `TIER_BG.Bronze` toward the darker brown brick tone; leave Silver as-is.

### 3. Harsher Deserved Rank (small nudge)
`src/lib/deservedRankEngine.js`
- Curve exponent 1.6 → **1.8** (further compresses mid scores).
- Baseline floor −1800 → **−2100**.
- Confidence cap tier: Diamond III (4499) → **Diamond I (3749)** when `confidence < 0.3`.
- Masters gate: winRate ≥58% → **≥60%**; Pro gate: winRate ≥62% → **≥64%**, star ≥30% → **≥33%**.

### 4. Brawler roster
`src/lib/brawlers.js`
- Remove `"Maddie"` from `BRAWLERS`.
- Auto-populate the roster from `BRAWLER_IDS`: derive `BRAWLERS` as `Object.keys(BRAWLER_IDS).sort()` so every ID in the map (including future additions) shows up automatically with the Brawlify CDN portrait already wired via `brawlerImageUrl()`. No prompts, no UI changes needed — dropdowns already read from `BRAWLERS`.

### 5. Safety-net audit (verify + fix if missing)
`src/lib/eloEngine.js`
- Confirmed present: permanent floors Bronze 0 / Silver 750 / Gold 1500 / Diamond 3000 (Diamond floor sticky once `highestElo ≥ 2250`).
- Confirmed present: Diamond+ sub-tier "boundary safety net" that stops the first loss at a sub-rank baseline (`rankObj.min`).
- Change: extend the boundary safety net so it fires on **every Mythic → Pro sub-rank boundary**, not only Roman "I". Rule: if `current > rankObj.min` and `eloAfter < rankObj.min`, clamp to `rankObj.min` (one-game safety net → next loss drops you a sub-rank as intended). Currently only Roman "I" ranks trigger this, which is why mid-sub-rank drops can overshoot.

---

### Technical details

- Star row uses inline SVG (same path as `BattleCard.StarIcon`) sized `w-4 h-4`; lit stars get `fill={color.text}` + `drop-shadow`, dim stars get `fill="rgba(255,255,255,0.15)"` + `stroke="rgba(255,255,255,0.25)"`.
- Bronze aura brick: `opacity: 0.28`, no blend mode; add `background: linear-gradient(180deg, rgba(60,20,5,0.35), transparent 60%)` behind bricks.
- Silver aura: delete the `Stormy sheen` div (lines ~198–210 in current file); keep bolts loop.
- `BRAWLERS` derivation preserves ordering by name (`localeCompare`) so BrawlerSelect stays stable.
- Assessment gate constants live in one block near `deservedElo` clamps — small numeric edits only.

### Out of scope
No plan split, no new components beyond edits above, no auth/room/UI restructuring.