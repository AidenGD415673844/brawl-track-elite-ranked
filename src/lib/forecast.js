// Match-based Monte Carlo forecast using official Supercell Ranked rules:
// - Bronze–Diamond: Best of 1
// - Mythic+: Best of 3 (win 2 of 3 rounds)
// - Underdog/favored: gain/loss scales with enemy Rank Score relative to yours
// - Rank floor protection prevents dropping below major rank floors
import { RANKS, getRankIndex, getRank } from "@/lib/ranks";
import { calculateElo } from "@/lib/eloEngine";

// Mythic I and above use Best-of-3 format
const BEST_OF_3_MIN_ELO = 4500;

// Match (series) win probability for Best-of-3: P(win) = 3p² - 2p³
function seriesWinProb(p) {
  return 3 * p * p - 2 * p * p * p;
}

// Dynamic gain/loss for a neutral matchup (enemies at same Elo).
// Used for summary display values (gainPerWin, lossPerDefeat).
export function getDynamicGainLoss(currentElo, winRate) {
  const winCalc = calculateElo(currentElo, {
    result: "victory",
    teammateElos: [],
    enemyElos: [],
  });
  const lossCalc = calculateElo(currentElo, {
    result: "defeat",
    teammateElos: [],
    enemyElos: [],
  });
  return { gain: winCalc.delta, loss: Math.abs(lossCalc.delta) };
}

export function getBoost(currentElo, targetElo) {
  const curIdx = getRankIndex(currentElo);
  const targetIdx = getRankIndex(targetElo);
  const ranksAway = targetIdx - curIdx;
  let multiplier = 0;
  if (ranksAway === 2) multiplier = 0.3;
  else if (ranksAway === 1) multiplier = 0.1;
  return {
    ranksAway: Math.max(0, ranksAway),
    multiplier,
    active: multiplier > 0,
    targetRank: RANKS[Math.min(RANKS.length - 1, Math.max(0, targetIdx))],
    label:
      multiplier === 0.3
        ? "30% Boost Active"
        : multiplier === 0.1
        ? "10% Boost Active"
        : "No Boost",
  };
}

function percentile(sortedArr, p) {
  if (sortedArr.length === 0) return 0;
  const idx = (sortedArr.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedArr[lo];
  return sortedArr[lo] + (sortedArr[hi] - sortedArr[lo]) * (idx - lo);
}

// Sample a single match outcome at a given Elo.
// Models enemy matchmaking variance (±300 Elo) which triggers the
// underdog/favored adjustments in the Elo engine.
function sampleMatchOutcome(elo, perRoundWinRate, peakElo, boostMultiplier) {
  const isBestOf3 = elo >= BEST_OF_3_MIN_ELO;

  // Best-of-3 amplifies skill: good players win more, weak players lose more
  const matchWinProb = isBestOf3 ? seriesWinProb(perRoundWinRate) : perRoundWinRate;

  const isWin = Math.random() < matchWinProb;

  // Matchmaking places enemies near your rank with ±300 Elo spread
  const enemyOffset = (Math.random() - 0.5) * 600;
  const enemyElo = Math.max(0, elo + enemyOffset);

  const calc = calculateElo(elo, {
    result: isWin ? "victory" : "defeat",
    teammateElos: [],
    enemyElos: [enemyElo],
    highestElo: Math.max(peakElo, elo),
  });

  let eloAfter = calc.eloAfter;

  // Apply external rank boost to wins (fades as you approach peak)
  if (isWin && boostMultiplier > 0 && elo < peakElo) {
    const extraGain = Math.round(calc.delta * boostMultiplier);
    eloAfter = eloAfter + extraGain;
  }

  return { eloAfter, isWin };
}

// Monte Carlo simulation with per-step dynamic gain/loss, enemy variance,
// Best-of-3 format, and rank floor protection.
export function runForecast({
  currentElo,
  winRate,
  matches = 40,
  trials = 800,
  boostMultiplier = 0,
  capElo = null,
}) {
  const perRoundWinRate = Math.min(0.99, Math.max(0.01, (Number(winRate) || 50) / 100));
  const start = Number(currentElo) || 0;
  const peakElo = start;

  // Summary gain/loss for display (neutral matchup, with boost)
  const { gain: baseGain, loss: baseLoss } = getDynamicGainLoss(currentElo, winRate);
  const displayGain = baseGain * (1 + boostMultiplier);

  const stepValues = Array.from({ length: matches + 1 }, () => []);

  for (let t = 0; t < trials; t++) {
    let elo = start;
    stepValues[0].push(elo);
    for (let m = 1; m <= matches; m++) {
      const outcome = sampleMatchOutcome(elo, perRoundWinRate, peakElo, boostMultiplier);
      elo = outcome.eloAfter;
      if (capElo !== null) elo = Math.min(elo, capElo);
      stepValues[m].push(elo);
    }
  }

  // Effective match win rate at starting Elo (for trend line)
  const isBestOf3AtStart = start >= BEST_OF_3_MIN_ELO;
  const effectiveWinRate = isBestOf3AtStart ? seriesWinProb(perRoundWinRate) : perRoundWinRate;
  const evPerMatch = effectiveWinRate * displayGain - (1 - effectiveWinRate) * baseLoss;

  const paths = stepValues.map((vals, m) => {
    const sorted = [...vals].sort((a, b) => a - b);
    return {
      match: m,
      low: Math.round(percentile(sorted, 0.1)),
      median: Math.round(percentile(sorted, 0.5)),
      high: Math.round(percentile(sorted, 0.9)),
      trend: Math.round(start + evPerMatch * m),
    };
  });

  const final = paths[paths.length - 1];
  return {
    paths,
    evPerMatch: Math.round(evPerMatch * 10) / 10,
    gainPerWin: Math.round(displayGain),
    lossPerDefeat: Math.round(baseLoss),
    final,
    isBestOf3: isBestOf3AtStart,
    effectiveWinRate: Math.round(effectiveWinRate * 100),
  };
}

export function climbScore(winRate, boostMultiplier = 0, currentElo = 4200) {
  const p = Math.min(0.99, Math.max(0.01, (Number(winRate) || 50) / 100));
  const { gain, loss } = getDynamicGainLoss(currentElo, winRate);
  const adjGain = gain * (1 + boostMultiplier);
  const isBestOf3 = currentElo >= BEST_OF_3_MIN_ELO;
  const matchWinProb = isBestOf3 ? seriesWinProb(p) : p;
  return Math.round((matchWinProb * adjGain - (1 - matchWinProb) * loss) * 10) / 10;
}

export function riskScore(winRate, currentElo = 4200) {
  const p = Math.min(0.99, Math.max(0.01, (Number(winRate) || 50) / 100));
  const { gain, loss } = getDynamicGainLoss(currentElo, winRate);
  const isBestOf3 = currentElo >= BEST_OF_3_MIN_ELO;
  const matchWinProb = isBestOf3 ? seriesWinProb(p) : p;
  const mean = matchWinProb * gain - (1 - matchWinProb) * loss;
  const variance =
    matchWinProb * Math.pow(gain - mean, 2) + (1 - matchWinProb) * Math.pow(-loss - mean, 2);
  return Math.round(Math.sqrt(variance));
}