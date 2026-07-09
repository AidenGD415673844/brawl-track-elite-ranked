// Brawler performance analysis by game mode from the battle log.
// Suggests top-performing brawlers for a given mode and rank bracket.

import { getRank } from "@/lib/ranks";
import { brawlerImageUrl } from "@/lib/brawlers";

// Returns top N brawler suggestions for a given mode, ranked by win rate.
// Requires a minimum number of games to be considered.
// battleLog: full log array
// mode: game mode string (e.g. "Heist")
// currentElo: player's current Elo (for rank bracket context)
// options: { topN, minGames }
export function suggestBrawlersByMode(battleLog, mode, currentElo, options = {}) {
  const { topN = 3, minGames = 2 } = options;
  const real = (battleLog || []).filter((e) => !e.manual && e.mode === mode);
  if (!real.length) return { suggestions: [], totalModeGames: 0 };

  const stats = {};
  for (const e of real) {
    const b = e.brawler || e.brawlers?.self;
    if (!b) continue;
    if (!stats[b]) stats[b] = { brawler: b, wins: 0, total: 0, eloGained: 0 };
    stats[b].total++;
    if (e.result === "victory") stats[b].wins++;
    stats[b].eloGained += e.delta || 0;
  }

  const ranked = Object.values(stats)
    .filter((s) => s.total >= minGames)
    .map((s) => ({
      ...s,
      winRate: Math.round((s.wins / s.total) * 100),
      avgElo: Math.round(s.eloGained / s.total),
      image: brawlerImageUrl(s.brawler),
    }))
    .sort((a, b) => {
      // Sort by win rate desc, then by games desc
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.total - a.total;
    })
    .slice(0, topN);

  return {
    suggestions: ranked,
    totalModeGames: real.length,
    rankTier: getRank(currentElo).tier,
  };
}