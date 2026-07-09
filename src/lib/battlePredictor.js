// Battle predictor — mathematical forecast of next battles based on
// win rate, team type, and enemy average rank.
import { calculateElo } from "@/lib/eloEngine";
import { getRank, getRankIndex, RANKS } from "@/lib/ranks";

export function predictBattles(
  playerElo,
  winRate,
  queueType,
  teammateElos = [],
  enemyElos = [],
  highestElo = playerElo
) {
  const enemyAvg =
    enemyElos.filter((e) => Number(e) > 0).reduce((a, b) => a + Number(b), 0) /
      Math.max(1, enemyElos.filter((e) => Number(e) > 0).length) || 0;

  // Win probability adjusted by Elo differential
  const eloDiff = enemyAvg > 0 ? playerElo - enemyAvg : 0;
  const baseProb = winRate / 100;
  const eloAdjust = eloDiff !== 0 ? Math.min(0.2, Math.max(-0.2, eloDiff / 2000)) : 0;
  const winProb = Math.min(0.95, Math.max(0.05, baseProb + eloAdjust));

  // Best case: all wins
  let bestElo = playerElo;
  const bestPath = [];
  for (let i = 0; i < 5; i++) {
    const calc = calculateElo(bestElo, {
      result: "victory",
      teammateElos,
      enemyElos,
      queueType,
      highestElo,
    });
    bestElo = calc.eloAfter;
    bestPath.push({
      battle: i + 1,
      result: "victory",
      delta: calc.delta,
      eloAfter: calc.eloAfter,
      rank: getRank(calc.eloAfter).name,
    });
  }

  // Worst case: all losses
  let worstElo = playerElo;
  const worstPath = [];
  for (let i = 0; i < 5; i++) {
    const calc = calculateElo(worstElo, {
      result: "defeat",
      teammateElos,
      enemyElos,
      queueType,
      highestElo,
    });
    worstElo = calc.eloAfter;
    worstPath.push({
      battle: i + 1,
      result: "defeat",
      delta: calc.delta,
      eloAfter: calc.eloAfter,
      rank: getRank(calc.eloAfter).name,
    });
  }

  // Expected (average) path
  let expectedElo = playerElo;
  const expectedPath = [];
  for (let i = 0; i < 5; i++) {
    const winCalc = calculateElo(expectedElo, {
      result: "victory",
      teammateElos,
      enemyElos,
      queueType,
      highestElo,
    });
    const lossCalc = calculateElo(expectedElo, {
      result: "defeat",
      teammateElos,
      enemyElos,
      queueType,
      highestElo,
    });
    const evDelta = winCalc.delta * winProb + lossCalc.delta * (1 - winProb);
    expectedElo = Math.round(expectedElo + evDelta);
    expectedPath.push({
      battle: i + 1,
      result: "projected",
      delta: Math.round(evDelta),
      eloAfter: expectedElo,
      rank: getRank(expectedElo).name,
    });
  }

  const currentRankIdx = getRankIndex(playerElo);
  const projectedRankIdx = getRankIndex(expectedElo);
  const rankChange = projectedRankIdx - currentRankIdx;

  return {
    winProb: Math.round(winProb * 100),
    bestCase: { finalElo: bestElo, finalRank: getRank(bestElo).name, path: bestPath },
    worstCase: { finalElo: worstElo, finalRank: getRank(worstElo).name, path: worstPath },
    expected: { finalElo: expectedElo, finalRank: getRank(expectedElo).name, path: expectedPath },
    rankChange,
    enemyAvg: Math.round(enemyAvg),
  };
}