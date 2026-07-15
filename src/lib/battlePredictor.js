// Battle predictor — forecast next 5 battles using real avg win/loss
// deltas from your battle log (fallback 90 / -50) and an optional
// Deserved Rank assessment boost (skill signal outside recent form).
import { getRank, getRankIndex } from "@/lib/ranks";
import { getAvgDeltas, getRecentWinRate } from "@/lib/battleStats";

// deservedElo (optional) — pulls win probability slightly toward the
// verdict that a Deserved Rank assessment produced. Weight is small so
// it never dominates raw match data.
export function predictBattles(
  playerElo,
  winRate,
  queueType,
  teammateElos = [],
  enemyElos = [],
  highestElo = playerElo,
  battleLog = [],
  deservedElo = null
) {
  const enemies = enemyElos.filter((e) => Number(e) > 0);
  const enemyAvg =
    enemies.length ? enemies.reduce((a, b) => a + Number(b), 0) / enemies.length : 0;

  // Prefer real recent WR when we have any log data, otherwise use the
  // provided (profile-level) rate.
  const recentWR = getRecentWinRate(battleLog, 20, Number(winRate) || 50);
  const baseProb = recentWR / 100;

  const eloDiff = enemyAvg > 0 ? playerElo - enemyAvg : 0;
  const eloAdjust = eloDiff !== 0 ? Math.min(0.2, Math.max(-0.2, eloDiff / 2000)) : 0;

  // Deserved Rank pull: if the assessment says you belong 300 Elo higher,
  // nudge win prob +3%. Capped at ±8%.
  let deservedAdjust = 0;
  if (Number.isFinite(deservedElo) && deservedElo > 0) {
    const gap = deservedElo - playerElo;
    deservedAdjust = Math.max(-0.08, Math.min(0.08, gap / 3000));
  }

  const winProb = Math.min(0.95, Math.max(0.05, baseProb + eloAdjust + deservedAdjust));

  const { avgWin, avgLoss } = getAvgDeltas(battleLog);

  const buildPath = (result) => {
    const delta = result === "victory" ? avgWin : avgLoss;
    let elo = playerElo;
    const path = [];
    for (let i = 0; i < 5; i++) {
      elo = Math.max(playerElo >= 3000 ? 3000 : 0, elo + delta);
      path.push({
        battle: i + 1,
        result,
        delta,
        eloAfter: elo,
        rank: getRank(elo).name,
      });
    }
    return { finalElo: elo, finalRank: getRank(elo).name, path };
  };

  const bestCase = buildPath("victory");
  const worstCase = buildPath("defeat");

  // Expected path: apply EV per battle
  let expElo = playerElo;
  const expectedPath = [];
  for (let i = 0; i < 5; i++) {
    const ev = winProb * avgWin + (1 - winProb) * avgLoss;
    expElo = Math.max(playerElo >= 3000 ? 3000 : 0, Math.round(expElo + ev));
    expectedPath.push({
      battle: i + 1,
      result: "projected",
      delta: Math.round(ev),
      eloAfter: expElo,
      rank: getRank(expElo).name,
    });
  }

  const currentRankIdx = getRankIndex(playerElo);
  const projectedRankIdx = getRankIndex(expElo);

  return {
    winProb: Math.round(winProb * 100),
    avgWin,
    avgLoss,
    recentWR,
    bestCase,
    worstCase,
    expected: { finalElo: expElo, finalRank: getRank(expElo).name, path: expectedPath },
    rankChange: projectedRankIdx - currentRankIdx,
    enemyAvg: Math.round(enemyAvg),
    deservedAdjust: Math.round(deservedAdjust * 100),
  };
}
