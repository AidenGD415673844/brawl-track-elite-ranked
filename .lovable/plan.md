# Plan — 3 Big Upgrades (queued, built after current turn)

## Upgrade 1 — Session Recap Widget
A collapsible "Today at a glance" card that pins to the top of Home showing:
- Session games, W/L, net Elo swing, best/worst brawler, best/worst mode.
- Auto-resets at local midnight; supports a "since last app open" toggle.
- Feeds the Deserved Rank engine as a fresh evidence slice.

## Upgrade 2 — Battle Log Search + Filter Bar
Add a sticky filter bar above the Battle Log:
- Fuzzy search across brawler names, modes, notes.
- Chips for result (W/L/D), queue type, star player, manual entries.
- Multi-select brawlers. Persists filters per BrawlSpace.

## Upgrade 3 — Rank Journey Sparkline in Hero
Compact 60-day Elo sparkline directly under the ProfileBadge:
- Shows tier-colored gradient fill, hover for exact Elo/date.
- Tap to expand into full EloProgressionChart.
- Uses existing snapshots + battle log; no new data.

These are queued for the next turn per user's ordering.
