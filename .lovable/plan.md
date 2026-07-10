# BrawlTrack Elite Upgrade Plan

## Hotfix Completed

- Removed the fatal startup dependency on the backend client from battle-log fetching and P2P sync.
- The app now renders even if the deployed build is missing backend env config instead of stopping at `supabaseUrl is required`.
- Verified locally with an iPad/Safari-style browser profile: the home screen loads with no page errors.
- Backend-powered actions now fail gracefully with a clear message instead of breaking the full app.

Note: the published URL must be updated/published from Lovable for this code fix to reach the live site.

## Phase 1: Stability and Setup Feedback

1. Add a small backend status chip near Settings/Fetch Logs:
   - Ready
   - Missing config
   - Function unavailable
   - Auth required
2. Improve Fetch Logs errors:
   - Detect missing backend config separately from Brawl Stars API failure.
   - Offer one-click Mock Data fallback when real logs cannot be fetched.
3. Improve P2P Sync errors:
   - Show whether local tab sync is active.
   - Show whether cross-device sync is unavailable.

## Phase 2: Rank-Up Add-ons

1. Rank-up checklist:
   - Shows what the player needs next: win streak, fewer throws, better brawler pool, safer modes.
2. Promotion readiness score:
   - Combines win rate, recent trend, tilt risk, and matchup quality.
3. Rank-up simulator:
   - Lets the player test “what if I win 3 of next 5?” scenarios.
4. Anti-tilt lock:
   - Optional warning after repeated losses before logging another match.

## Phase 3: Season Report Upgrades

1. Season timeline:
   - Peak Elo, worst dip, biggest comeback, longest streak, most-used brawlers.
2. Season badges:
   - Clutch finisher, comeback king, consistent climber, tilt survivor, MVP streak.
3. Report comparison:
   - Compare this season vs last season.
4. Export polish:
   - Better mobile PDF layout.
   - Add “share card” image export for season highlights.

## Phase 4: Deserved Rank Extensions

1. Assessment history trends:
   - Show deserved Elo movement over time.
   - Highlight which skill category improved or declined.
2. Feedback engine:
   - Generate specific focus notes from assessment inputs and battle-log data.
3. Rank gap explainer:
   - Explains why current Elo differs from deserved Elo.
4. Re-assessment reminders:
   - Weekly or after 20 logged matches.

## Phase 5: UI and Animation Fixes

1. Battle card asset cleanup:
   - Fix broken/missing brawler portrait placeholders visible in the card gallery.
2. Mobile header polish:
   - Reduce cramped nav buttons on iPad/mobile widths.
3. Tier animation performance mode:
   - Automatically reduce heavy effects on low-power/mobile browsers.
4. Progress bar clarity:
   - Better labels for current Elo vs season-high ghost bar.

## Recommended Build Order

1. Backend status and graceful Fetch Logs/P2P messages.
2. Broken portrait/card image cleanup.
3. Rank-up checklist and promotion readiness score.
4. Season report timeline and badges.
5. Deserved Rank trend + feedback engine.