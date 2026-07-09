// Season story computation — extracts narrative stats from a season's battle log.
import { getBestWinStreak } from "@/lib/battleLog";
import { brawlerImageUrl } from "@/lib/brawlers";

// seasonLog: array of battle entries (newest-first, as stored).
// Returns a story object with fun-fact highlights for the Season End Report.
export function computeSeasonStory(seasonLog) {
  const log = [...(seasonLog || [])].filter((e) => !e.manual);
  const chrono = [...log].reverse(); // oldest first

  if (!chrono.length) return { hasData: false };

  const bestStreak = getBestWinStreak(log);

  // Top brawler by match count (with win rate)
  const brawlerCounts = {};
  const brawlerWins = {};
  for (const e of chrono) {
    const b = e.brawler || e.brawlers?.self;
    if (!b) continue;
    brawlerCounts[b] = (brawlerCounts[b] || 0) + 1;
    if (e.result === "victory") brawlerWins[b] = (brawlerWins[b] || 0) + 1;
  }
  let topBrawler = null;
  let topBrawlerCount = 0;
  for (const [b, count] of Object.entries(brawlerCounts)) {
    if (count > topBrawlerCount) {
      topBrawler = b;
      topBrawlerCount = count;
    }
  }
  const topBrawlerWinRate =
    topBrawler && brawlerCounts[topBrawler] > 0
      ? Math.round(((brawlerWins[topBrawler] || 0) / brawlerCounts[topBrawler]) * 100)
      : 0;

  // Best mode by win rate (min 3 games)
  const modeStats = {};
  for (const e of chrono) {
    if (!e.mode || e.mode === "Manual") continue;
    if (!modeStats[e.mode]) modeStats[e.mode] = { wins: 0, total: 0 };
    modeStats[e.mode].total++;
    if (e.result === "victory") modeStats[e.mode].wins++;
  }
  let bestMode = null;
  let bestModeWR = 0;
  let bestModeGames = 0;
  for (const [mode, s] of Object.entries(modeStats)) {
    if (s.total < 3) continue;
    const wr = Math.round((s.wins / s.total) * 100);
    if (wr > bestModeWR || (wr === bestModeWR && s.total > bestModeGames)) {
      bestMode = mode;
      bestModeWR = wr;
      bestModeGames = s.total;
    }
  }

  // Breakthrough (best positive delta) and Stumble (worst delta)
  let breakthrough = null;
  let stumble = null;
  for (const e of chrono) {
    const d = e.delta || 0;
    if (!breakthrough || d > breakthrough.delta) breakthrough = e;
    if (!stumble || d < stumble.delta) stumble = e;
  }

  // Elo journey points for the timeline scrubber (chronological)
  const eloPoints = chrono.map((e, i) => ({
    index: i,
    elo: e.eloAfter,
    delta: e.delta || 0,
    brawler: e.brawler || e.brawlers?.self || null,
    mode: e.mode,
    result: e.result,
    timestamp: e.timestamp,
  }));

  return {
    hasData: true,
    bestStreak,
    topBrawler,
    topBrawlerCount,
    topBrawlerWinRate,
    topBrawlerImage: topBrawler ? brawlerImageUrl(topBrawler) : null,
    bestMode,
    bestModeWR,
    bestModeGames,
    breakthrough,
    stumble,
    eloPoints,
    totalGames: chrono.length,
  };
}