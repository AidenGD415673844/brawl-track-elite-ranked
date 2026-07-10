Splitting the work into two phases. I'll do Phase 1 next turn, then Phase 2 the turn after.

## Phase 1 — Battle-card background restore + particle Settings

### 1. Fix "background not restored" bug
Root cause: several tier auras in `src/components/TierAuraOverlay.jsx` (Bronze brick, Silver sheen, Mythic/Legendary/Masters/Pro base glows) paint a fully-opaque layer that hides `TIER_BG` + `TIER_DECOR` set on `BattleCard`. For Diamond specifically, the `GridBackdrop` uses `mixBlendMode: screen` at 0.9 opacity on top of a transparent radial, washing the blue gradient into a pale grey.

Fix:
- Rework `GridBackdrop`: drop `mixBlendMode: screen`, lower opacity to ~0.35, and render it as a lightweight grid tile behind particles but above the card gradient. Vignette becomes a separate optional layer.
- Bronze/Silver/Mythic/Legendary/Masters/Pro aura components: strip their opaque base fills. Keep only the transparent glow accents; `TIER_BG` from `battleCards.js` is the source of truth for the base color.
- Bronze brick pattern stays, but rendered with `mix-blend-multiply` at reduced opacity so the brown gradient still reads.
- Verify with Playwright screenshots of Diamond, Bronze, Mythic, Pro cards in the gallery.

### 2. Particle Settings (toggle + intensity)
- Extend `src/lib/haptics.js` pattern with a new tiny module `src/lib/animPrefs.js` holding: `particlesEnabled` (bool, default true) and `particleIntensity` (`low` | `medium` | `high`, default `medium`). Backed by `localStorage`, with a `useAnimPrefs()` hook.
- `src/components/TierAuraOverlay.jsx`: read prefs. If disabled → render only `GridBackdrop` + static tier glow. Intensity scales particle counts (e.g. bullets/stars/blasts × 0.5 / 1 / 1.5) and animation durations.
- `src/pages/Settings.jsx`: add a new card "Battle Card Particles" with a Switch (enable/disable) and a 3-button segmented control for intensity, mirroring the existing "Tier Animation Performance" card style. Keep the existing perf-mode card — this new one is user-facing intensity, perf-mode stays as the auto/high/low low-power override.

### 3. Files touched (Phase 1)
- `src/components/TierAuraOverlay.jsx` — grid fix, strip opaque bases, wire prefs.
- `src/lib/animPrefs.js` — new prefs module + hook.
- `src/pages/Settings.jsx` — new Particles card.
- No logic file changes.

### 4. Verification
- `bun run build`.
- Playwright screenshot the Battle Cards gallery on Home; confirm each tier shows its intended TIER_BG gradient (brown Bronze, blue Diamond, purple Mythic, gold Pro) with particles layered on top.
- Toggle off in Settings → screenshot shows plain gradient + grid, no particles.

---

## Phase 2 — Lovable Cloud auth (optional, for rooms & sharing only)

Ranked tracking stays 100% local — auth is only gated for real-time features.

### 1. Enable email + Google auth
- Turn on Lovable Cloud auth: email/password + Google (Cloud defaults).
- `disable_signup: false`, `auto_confirm_email: false`, `password_hibp_enabled: true`, `external_anonymous_users_enabled: false`.
- Configure Google via managed social auth.

### 2. Optional-auth model
- `src/lib/AuthContext.jsx` already exists — keep it. Add an `isOptional` flag: unauthenticated users still get full Home / ranked tracking / Deserved Rank / Season Report.
- Add a small "Sign in" chip in the Home header (next to `BackendStatusChip`). Signed-out users see "Sign in for rooms". Signed-in users see avatar + email menu with Sign out.
- New page `src/pages/AuthPage.jsx` (route `/auth`) with tabs: Sign in / Sign up / Forgot password. Uses `supabase.auth` + `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`.
- New page `src/pages/ResetPassword.jsx` already exists — keep as-is, verify it still works.

### 3. Profiles table (optional metadata for room display)
Migration creates `public.profiles(id uuid pk → auth.users, display_name text, avatar_url text, created_at)`, with proper GRANTs + RLS (users read all, update own), plus signup trigger to auto-create a profile row.

### 4. Gate rooms/sharing only
- `src/components/LiveKitLobby.jsx` + `src/components/TeammateRoom.jsx` + P2P sync entry points: if `!user`, show an inline "Sign in to create/join rooms" CTA linking to `/auth?next=<current>`.
- Everything else (Home, Deserved Rank, Season Report, Settings, Battle Cards) stays fully usable signed-out.

### 5. Files touched (Phase 2)
- `src/pages/AuthPage.jsx` — new.
- `src/App.jsx` — register `/auth` route.
- `src/lib/AuthContext.jsx` — add optional-auth semantics + Google helper.
- `src/pages/Home.jsx` — sign-in chip in header.
- `src/components/LiveKitLobby.jsx`, `src/components/TeammateRoom.jsx` — auth gate.
- Supabase: `configure_auth`, `configure_social_auth(["google"])`, migration for `profiles` + trigger.

### 6. Verification
- `bun run build`.
- Playwright: signed-out Home renders, Deserved Rank works, Battle Cards work. Visiting rooms shows the sign-in CTA. `/auth` renders both tabs.
- Confirm Google button opens the OAuth flow (no `Unsupported provider`).

---

Say the word and I'll ship Phase 1 next turn.