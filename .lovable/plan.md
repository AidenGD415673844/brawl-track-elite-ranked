
# Deserved Rank History + Polish Pass

## 1. Assessment History Panel (main ask)

**Storage** — new `src/lib/assessmentHistory.js`
- localStorage key `deserved_rank_history_v1` (dual-write backup key like the battle log).
- Cap 50 entries, FIFO trim. Each entry:
  ```
  { id, timestamp, currentElo, currentRankName, deservedElo,
    deservedRankName, deltaElo, deltaIdx, confidence, sampleSize,
    responses, categories, adjustments, verdict, verdictClass }
  ```
- API: `loadHistory()`, `saveAssessment(result, responses)`, `deleteAssessment(id)`, `clearHistory()`.

**Auto-save** — in `DeservedRank.jsx`, call `saveAssessment(...)` inside `handleComplete` before showing the reveal.

**History panel** — new `src/components/AssessmentHistoryPanel.jsx`
- Rendered on the intro screen below the "Start Assessment" card.
- Collapsed by default with a header row: `History · {n} runs` + trash-all button.
- Each row shows: date/time, current-rank badge → deserved-rank badge, Elo delta chip (green/red/amber), confidence %, sample size.
- Click a row to expand inline: skill breakdown bars + adjustments table (reuses the same visual language as the reveal), plus two actions:
  - **View full reveal** — pushes the entry through `DeservedRankReveal` in read-only mode (hides the Retake button, keeps Done).
  - **Rerun with these answers** — seeds `responses` state and jumps to the wizard.
- Empty state: subtle prompt "Complete your first assessment to start tracking your growth."

**Trend strip** — small sparkline at the top of the panel showing deserved Elo over time (SVG polyline, tier-colored gradient). Skipped if fewer than 2 entries.

**Reveal tweak** — `DeservedRankReveal` gains an optional `readOnly` prop and a `savedAt` label chip when viewing a historical entry.

## 2. Bug + logic fixes

- **Duplicate "Impact grades" row** in `deservedRankEngine.js` — the adjustments array lists Star player and then a zero-value Impact grades row for the same metric. Remove the dead row.
- **Battle log filter mismatch** — the intro says "N battles feeding this analysis" using `!e.manual`, but the engine's `streakStability` / `bestStreak` use the full log. Standardize on the non-manual filter everywhere so numbers match what the user sees.
- **Season-highest never decreases mid-session** — `Home.jsx` currently only bumps `currentSeasonHighest` on save. Recompute it from the battle log on load so a browser reset can't wipe it below current Elo.
- **Diamond floor edge case** — the 3000 floor kicks in for anyone who *ever* touched Diamond, but a player who reset their profile keeps the flag. Add a "Reset Diamond floor" toggle inside the profile settings sheet for the rare user who wants a clean slate.
- **Assess Rank nav button** wraps awkwardly on the 586px viewport the user is on — shrink to icon-only under `sm:` with a tooltip.

## 3. New features

- **Compare mode** — from history, long-press (or a "Compare" button on two selected rows) opens a side-by-side diff: category deltas, adjustment deltas, Elo swing. Useful for "am I actually improving?"
- **Weekly reminder chip** — if the newest history entry is > 7 days old, show a soft pill on the Home header: "It's been 9 days — reassess?" that deep-links into `/deserved-rank`.
- **Export / Import assessment history** — piggyback on the existing CSV/PDF exporter. New JSON export for the full history (portable across devices) and a matching import button.
- **"Suggested focus" card on the reveal** — reads the two lowest category scores and surfaces one concrete drill per pillar (curated list, not AI). Keeps the reveal actionable rather than just diagnostic.

## 4. Animation + UI polish

- **Reveal ShatterBurst intensity** currently scales linearly with |deltaIdx|; cap it so massive deltas don't nuke low-end devices. Add `prefers-reduced-motion` bypass that swaps in a static tier-colored glow.
- **RankScale ghost bar** — the dashed peak marker gets clipped when the peak is exactly at a sub-rank boundary. Nudge it 2px inward and add a small chevron.
- **Tier aura overlays** — the Legendary lightning + fire combo overlaps the card copy at narrow widths. Gate the lightning layer behind `min-width: 380px` and reduce fire opacity to 0.55.
- **Home header** — the aurora radial-gradient re-renders every frame because it's inline; move to a keyframed CSS class so it composites on the GPU.
- **Confetti-free reveal on "over-ranked"** — right now the ShatterBurst fires regardless; use a muted implosion animation when `verdictClass === "over"` so the tone matches the message.

## 5. Technical notes

- All new files are frontend-only, no schema changes, no edge functions.
- History payload for 50 entries × ~4KB ≈ 200KB — well under localStorage's 5MB budget.
- `readOnly` reveal path avoids re-running `computeDeservedRank`; it renders straight from the stored entry so historical results stay stable even if the engine constants change.
- No changes to the Elo engine, matchmaking validator, or edge functions.

## 6. Scope this turn

Confirm which of these to ship now. Default recommendation:
1. History panel (storage + panel + auto-save + rerun/view actions) — the explicit ask.
2. Fixes 2.1 (duplicate adjustment row), 2.2 (filter mismatch), 2.5 (nav wrap).
3. Feature 3.4 (Suggested focus card) since it's a small addition to the reveal.

Push the rest (compare mode, reminder chip, export/import, larger animation refactor, Diamond floor toggle, season-highest recompute) to a follow-up so this turn stays reviewable.
