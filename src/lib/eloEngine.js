// Deep Analysis Elo Engine
// Uses standard Elo expected-score formula with Brawl Stars tuning.
// Factors: expected win probability, carry detection, premade skill confidence,
// tier-based K-factors, season refresh, floor protection, Mythic+ safety net.
import { getRank, getRankIndex, RANKS } from "@/lib/ranks";

// K-factors by tier: lower ranks climb faster, high ranks lose harder.
// At low tiers K_win > K_loss (forgiving climb); at Legendary+ K_loss climbs
// steeply so demotions bite much harder the higher you go.
const K_FACTOR = {
  Bronze: { win: 160, loss: 60 },
  Silver: { win: 150, loss: 70 },
  Gold: { win: 130, loss: 80 },
  Diamond: { win: 115, loss: 95 },
  Mythic: { win: 105, loss: 115 },
  Legendary: { win: 90, loss: 140 },
  Masters: { win: 88, loss: 170 },
  Pro: { win: 84, loss: 200 },
};

// Minimum win gain per tier — a victory is never worth less than this, no matter
// how heavily favored you were. Fixes tiny gains vs much lower-ranked enemies.
const MIN_WIN = {
  Bronze: 85,
  Silver: 80,
  Gold: 75,
  Diamond: 75,
  Mythic: 70,
  Legendary: 60,
  Masters: 55,
  Pro: 50,
};

// Minimum loss magnitude per tier — a defeat always costs at least this much.
// High tiers carry a heavy floor so climbing gets progressively riskier.
const MIN_LOSS = {
  Bronze: 10,
  Silver: 12,
  Gold: 15,
  Diamond: 18,
  Mythic: 22,
  Legendary: 55,
  Masters: 70,
  Pro: 85,
};

// Permanent major rank floors — Bronze through Gold can't drop below these.
const RANK_FLOORS = {
  Bronze: 0,
  Silver: 750,
  Gold: 1500,
};

// Match format: Mythic+ is Best of 3, below is Best of 1 (official rules)
export function getFormatForTier(tier) {
  return ["Mythic", "Legendary", "Masters", "Pro"].includes(tier) ? "Best of 3" : "Best of 1";
}

// No tier is solo-queue only — all ranks allow Duo/Trio per official Ranked 3.0 rules.
export function isSoloQueueOnly(tier) {
  return false;
}

// Matchmaking offset: Duo queues face enemies at highest teammate +200,
// Trio queues at highest teammate +500 (official Ranked 3.0 matchmaking rules).
export function getMatchmakingOffset(queueType) {
  if (queueType === "duo") return 200;
  if (queueType === "trio") return 500;
  return 0;
}

// The effective enemy Elo a party will be matched against.
export function getEffectiveEnemyElo(queueType, teammateElos = [], playerElo = 0) {
  const allElos = [playerElo, ...(teammateElos || [])].map(Number).filter((e) => !isNaN(e) && e > 0);
  if (allElos.length === 0) return Number(playerElo) || 0;
  const highest = Math.max(...allElos);
  return highest + getMatchmakingOffset(queueType);
}

function avgElo(elos) {
  const valid = (elos || []).filter((e) => Number(e) > 0).map(Number);
  if (!valid.length) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function getFloorForElo(elo) {
  const rank = getRank(elo);
  return RANK_FLOORS[rank.tier] ?? 0;
}

// Elo expected score: probability of winning against a given opponent Elo.
// E = 1 / (1 + 10^((opponent - player) / DIVISOR))
// A very wide divisor (1200) heavily compresses win probability toward 0.5,
// making the delta almost insensitive to raw elo gap unless the gap is large.
const EXPECTED_DIVISOR = 1200;
function expectedScore(playerElo, opponentElo) {
  if (opponentElo <= 0) return 0.5;
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / EXPECTED_DIVISOR));
}

// Underdog bonus: if opponent is at least ~1 sub-rank higher (50+ elo diff),
// the lower-ranked player gets a flat +5 on a victory. Applied after core delta.
const UNDERDOG_GAP_THRESHOLD = 50;
const UNDERDOG_BONUS = 5;

// Premade skill confidence: adjusts delta based on premade teammates' true skill.
// If a teammate's peak rank (highestElo / lastSeasonElo) is higher than their current
// Elo, they're undervalued — the team is effectively stronger than it appears.
// Trophies add a small experience factor.
// Returns a value in [-0.12, 0.12]: positive = team undervalued (stronger than shown).
function computePremadeAdjustment(teammateElos, teammateProfiles) {
  if (!teammateProfiles || teammateProfiles.length === 0) return 0;

  let totalAdjustment = 0;
  let premadeCount = 0;

  for (let i = 0; i < teammateElos.length; i++) {
    const profile = teammateProfiles[i];
    if (!profile) continue;

    const currentElo = Number(teammateElos[i]) || 0;
    if (currentElo <= 0) continue;

    const peakElo = Math.max(Number(profile.highestElo) || 0, Number(profile.lastSeasonElo) || 0);
    const trophies = Number(profile.trophies) || 0;

    // Only count as premade if they have profile data
    if (peakElo <= 0 && trophies <= 0) continue;
    premadeCount++;

    // Undervaluation: if peak > current, teammate is better than their Elo shows
    if (peakElo > currentElo) {
      const undervaluation = (peakElo - currentElo) / 1000; // 500 gap = 0.5
      totalAdjustment += undervaluation * 0.06; // ~6% per 1000 Elo gap
    }

    // Trophies: experience factor (50k trophies ≈ 4% boost)
    if (trophies > 0) {
      totalAdjustment += Math.min(0.04, trophies / 1250000);
    }
  }

  if (premadeCount === 0) return 0;
  return Math.max(-0.12, Math.min(0.12, totalAdjustment / premadeCount));
}

/**
 * Calculate Elo delta and new rating after a match.
 *
 * Deep analysis pipeline:
 *   1. Expected win probability via standard Elo formula (player Elo vs enemy avg)
 *   2. Core delta = K × (actual − expected), with asymmetric K for wins vs losses
 *   3. Carry factor: star player gets +12% gain / −15% loss
 *   4. Premade skill confidence: adjusts for teammates' peak rank, last season, trophies
 *   5. Ranked boost: +8% on victory if below previous peak
 *   6. Floor protection & Diamond+ threshold safety net
 *
 * @param {number} playerElo - Current player Elo
 * @param {object} opts
 * @param {string} opts.result - "victory" | "defeat" | "draw"
 * @param {number[]} opts.teammateElos
 * @param {number[]} opts.enemyElos
 * @param {boolean} opts.seasonRefreshed
 * @param {string} opts.queueType - "solo" | "duo" | "trio"
 * @param {number} opts.highestElo - Previous peak for ranked boost
 * @param {boolean|string} opts.starPlayer - true / "self" if player was star
 * @param {object[]} opts.teammateProfiles - Premade profiles: { highestElo, lastSeasonElo, trophies, skill }
 * @param {number} opts.manualDelta - Manual override (bypasses all logic)
 */
export function calculateElo(playerElo, opts = {}) {
  const current = Math.max(0, Number(playerElo) || 0);

  // Manual adjustment — bypass all logic
  if (opts.manualDelta !== undefined && opts.manualDelta !== null) {
    const delta = Number(opts.manualDelta) || 0;
    return {
      delta,
      eloAfter: Math.max(0, current + delta),
      details: { type: "manual", delta },
    };
  }

  const result = opts.result;
  const isWin = result === "victory";
  const isDraw = result === "draw";
  const rank = getRank(current);
  const k = K_FACTOR[rank.tier] || K_FACTOR.Diamond;
  const queueType = opts.queueType || "solo";
  const highestElo = Number(opts.highestElo) || current;

  const enemyAvg = avgElo(opts.enemyElos);
  const teammateAvg = avgElo(opts.teammateElos);

  const teamSize = (opts.teammateElos?.length || 0) + 1;
  const teamAvg = teammateAvg > 0 ? (current + teammateAvg * (teamSize - 1)) / teamSize : current;

  // --- Season refresh: flat +100 / -30, no other adjustments ---
  if (opts.seasonRefreshed) {
    const flatDelta = isWin ? 100 : isDraw ? 0 : 30;
    const delta = isWin ? flatDelta : isDraw ? 0 : -flatDelta;
    return {
      delta,
      eloAfter: Math.max(0, current + delta),
      details: {
        type: "season_refresh",
        rankTier: rank.tier,
        enemyAvg: Math.round(enemyAvg),
        teamAvg: Math.round(teamAvg),
        queueType,
        seasonRefreshed: true,
        format: getFormatForTier(rank.tier),
      },
    };
  }

  // --- Core: Expected score formula ---
  // Compare player's individual Elo to enemy team average.
  const expScore = expectedScore(current, enemyAvg);

  let delta;
  if (isWin) {
    // Win: delta proportional to how unlikely the win was
    delta = k.win * (1 - expScore);
  } else if (isDraw) {
    // Draw: positive if underdog, negative if favored
    delta = 60 * (0.5 - expScore);
  } else {
    // Loss: delta proportional to how likely the win was (favored teams lose more)
    delta = -(k.loss * expScore);
  }

  // --- Carry factor: star player explicitly carried ---
  const isStarPlayer = opts.starPlayer === true || opts.starPlayer === "self";
  if (isStarPlayer) {
    delta *= isWin ? 1.12 : isDraw ? 1.0 : 0.85;
  }

  // --- Premade skill confidence ---
  // Only for duo/trio with teammate profiles (not solo randoms)
  const premadeAdjustment =
    (queueType === "duo" || queueType === "trio") && opts.teammateProfiles
      ? computePremadeAdjustment(opts.teammateElos || [], opts.teammateProfiles)
      : 0;

  if (premadeAdjustment !== 0) {
    // Positive adjustment = team is undervalued (stronger than it appears)
    // Wins: reduce gain (you had an advantage), Losses: increase loss (you should've won)
    if (isWin) {
      delta *= 1 - premadeAdjustment;
    } else if (!isDraw) {
      delta *= 1 + premadeAdjustment;
    }
  }

  // --- Ranked boost: +8% on victory if below previous peak ---
  const rankedBoost = isWin && current < highestElo;
  if (rankedBoost) {
    delta *= 1.08;
  }

  // --- Underdog bonus: +5 on victory when opponent is higher-ranked ---
  // Applied whenever the enemy team avg exceeds the player's elo by at least
  // one sub-rank (~50 elo). "Even by a few elo" — small gaps still trigger.
  const isUnderdog = isWin && enemyAvg - current >= UNDERDOG_GAP_THRESHOLD;
  if (isUnderdog) {
    delta += UNDERDOG_BONUS;
  }

  // --- Tier floors: guarantee a minimum win gain / loss cost ---
  if (isWin && delta > 0) {
    const minWin = MIN_WIN[rank.tier] ?? 0;
    if (delta < minWin) delta = minWin;
  } else if (!isWin && !isDraw) {
    const minLoss = MIN_LOSS[rank.tier] ?? 0;
    if (-delta < minLoss) delta = -minLoss;
  }

  // Round to integer
  delta = Math.round(delta);

  let eloAfter = current + delta;

  // --- Floor protection: Bronze through Gold have permanent major rank floors ---
  if (!isWin && delta < 0) {
    const floor = getFloorForElo(current);
    if (floor > 0 && eloAfter < floor) {
      eloAfter = floor;
    }
  }

  // --- Diamond+ threshold protection: can't drop below major tier boundary
  // unless already at the boundary (demotion allowed per official rules) ---
  if (!isWin && delta < 0) {
    const curIdx = getRankIndex(current);
    const rankObj = RANKS[curIdx];
    if (curIdx >= 9 && rankObj.roman === "I") {
      const baseline = rankObj.min;
      if (current > baseline && eloAfter < baseline) {
        eloAfter = baseline;
      }
    }
  }

  eloAfter = Math.max(0, Math.round(eloAfter));
  delta = eloAfter - current;

  return {
    delta,
    eloAfter,
    details: {
      type: "deep_analysis",
      expScore: Math.round(expScore * 100) / 100,
      kWin: k.win,
      kLoss: k.loss,
      rankTier: rank.tier,
      enemyAvg: Math.round(enemyAvg),
      teamAvg: Math.round(teamAvg),
      eloDiff: Math.round(enemyAvg - current),
      isStarPlayer,
      premadeAdjustment: Math.round(premadeAdjustment * 100) / 100,
      rankedBoost,
      isUnderdog,
      queueType,
      matchmakingOffset: getMatchmakingOffset(queueType),
      seasonRefreshed: false,
      format: getFormatForTier(rank.tier),
    },
  };
}

/**
 * Check if a rank-up occurred between two Elo values.
 */
export function checkRankUp(oldElo, newElo) {
  const oldRank = getRank(oldElo);
  const newRank = getRank(newElo);
  const oldIdx = getRankIndex(oldElo);
  const newIdx = getRankIndex(newElo);

  const isRankUp = newIdx > oldIdx;
  const isMajorRankUp = isRankUp && newRank.tier !== oldRank.tier;

  return { isRankUp, oldRank, newRank, isMajorRankUp };
}
