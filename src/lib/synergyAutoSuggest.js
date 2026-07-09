// Synergy auto-suggest — recommends the best teammate brawlers based on
// historical win rates when paired with the player's selected brawler.

import { brawlerImageUrl } from "@/lib/brawlers";

// Returns the top N teammate brawlers that have the highest win rates
// when the player used `selfBrawler`.
// battleLog: full log array
// selfBrawler: the player's selected brawler name
// options: { topN, minGames }
export function suggestTeammates(battleLog, selfBrawler, options = {}) {
  const { topN = 2, minGames = 1 } = options;
  if (!selfBrawler) return { suggestions: [], totalWithBrawler: 0 };

  const real = (battleLog || []).filter((e) => !e.manual);
  const withBrawler = real.filter((e) => {
    const b = e.brawler || e.brawlers?.self;
    return b === selfBrawler;
  });

  if (withBrawler.length === 0) return { suggestions: [], totalWithBrawler: 0 };

  // Count teammate brawler appearances and wins
  const mateStats = {};
  for (const e of withBrawler) {
    const mates = [
      e.brawlers?.mate1, e.brawlers?.mate2, e.brawlers?.mate3,
    ].filter(Boolean);

    for (const m of mates) {
      if (!mateStats[m]) mateStats[m] = { brawler: m, wins: 0, total: 0 };
      mateStats[m].total++;
      if (e.result === "victory") mateStats[m].wins++;
    }
  }

  const ranked = Object.values(mateStats)
    .filter((s) => s.total >= minGames)
    .map((s) => ({
      ...s,
      winRate: Math.round((s.wins / s.total) * 100),
      image: brawlerImageUrl(s.brawler),
    }))
    .sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.total - a.total;
    })
    .slice(0, topN);

  return {
    suggestions: ranked,
    totalWithBrawler: withBrawler.length,
  };
}