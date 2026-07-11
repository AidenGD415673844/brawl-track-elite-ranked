# Plan: Kill the supabaseUrl Bug Forever + 3 Upgrades

## Part 1 — Permanent fix for "supabaseUrl is required"

**Root cause:** the published build is missing `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` because Vite bakes env vars at build time. When the build runs without them, `createClient(undefined, undefined)` throws before any React renders — hence the fallback screen.

Since the project URL and publishable (anon) key are **public values** (safe in the browser bundle) and are already visible in `supabase/config.toml`, we can guarantee the app boots by hard-coding them as fallbacks. Env vars still take precedence.

**Changes:**
1. **`src/integrations/supabase/client.ts`** — Add constant fallbacks:
   ```ts
   const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "https://uudxwsxuehwocnexpany.supabase.co";
   const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "<anon key>";
   ```
   This eliminates the throw regardless of build env state.
2. **`src/lib/backendStatus.js`** — Treat presence of URL+key (env OR fallback) as configured, so the status chip stops flashing red.
3. **`src/main.jsx`** — Keep the dynamic-import fallback screen as a last-resort safety net.

Result: the white-screen / "supabaseUrl is required" error can never appear again in published builds.

## Part 2 — Three upgrades

### Upgrade A — Smoother TierAuraOverlay (perf + visual)
- Move heavy particle DOM (Mythic explosions, Masters debris, Pro crowns) behind a single `IntersectionObserver` so off-screen cards don't animate — cuts jank on the gallery scroll.
- Add `will-change: transform, opacity` and `contain: strict` to particle wrappers in `src/index.css` for GPU compositing.
- Add a subtle 6s parallax drift to the grid backdrop (translate ±4px) so idle cards feel alive without new DOM.

### Upgrade B — Battle Card "Flip to Stats" interaction
- Click/tap a card in `src/components/BattleCard.jsx` → 3D flip (framer-motion `rotateY`) to a back face showing tier-specific stats pulled from existing battle log: games at tier, win%, avg Elo swing, meme title.
- No new data model — reads from `playerStorage` + `rankFrequency` we already compute.
- Adds real utility to the gallery without changing card fronts.

### Upgrade C — Rank Scale "milestone ticks" + hover peek
- In `src/components/RankScale.jsx`, add small tick marks at each sub-rank boundary within the current tier, plus a hover/tap tooltip showing "X Elo to <next sub-rank name>".
- Animated shimmer sweep across the fill bar on Elo change (already have `AnimatedCounter`; hook the same trigger).
- Purely visual — no engine changes.

## Technical Notes
- All three upgrades are frontend-only, no migrations, no new deps (framer-motion already in use).
- The supabase fallback keeps env-var override behavior so Lovable Cloud env swaps still work.
- Anon key is public by design (RLS protects data) — safe to inline.
