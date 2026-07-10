// Elo Engine — rewritten around explicit per-tier bounds.
//
// Design goals:
//  • Every Elo delta is rigidly clamped inside the tier's absolute bounds.
//  • Equal-sub-rank battles land inside the "equal band" (tier-specific).
//  • Larger rank gaps scale linearly outward toward the absolute min/max.
//  • Underdog bonus: player 1 sub-rank below their opponent gets +5.
//  • Legacy modifiers (star player, premade, ranked boost, season refresh,
//    floor protection, Diamond+ boundary protection) preserved but the tier
//    absolute bounds are re-applied as the final clamp.
import { getRank, getRankIndex, RANKS } from "@/lib/ranks";

// ── Tier bounds table ────────────────────────────────────────
// equalWin / equalLoss = range for equal-sub-rank matches.
// absWin / absLoss     = hard clamps regardless of rank gap.
const TIER_BOUNDS = {
  Bronze:    { equalWin: [100, 120], equalLoss: [30, 50],  absWin: [80, 200], absLoss: [20, 100] },
  Silver:    { equalWin: [90, 115],  equalLoss: [35, 55],  absWin: [80, 200], absLoss: [20, 100] },
  Gold:      { equalWin: [85, 110],  equalLoss: [45, 70],  absWin: [80, 200], absLoss: [25, 120] },
  Diamond:   { equalWin: [80, 110],  equalLoss: [50, 75],  absWin: [75, 180], absLoss: [30, 140] },
  Mythic:    { equalWin: [75, 105],  equalLoss: [50, 80],  absWin: [75, 165], absLoss: [35, 150] },
  Legendary: { equalWin: [70, 100],  equalLoss: [55, 90],  absWin: [60, 150], absLoss: [40, 165] },
  Masters:   { equalWin: [70, 95],   equalLoss: [60, 100], absWin: [55, 140], absLoss: [50, 185] },
  Pro:       { equalWin: [65, 90],   equalLoss: [70, 110], absWin: [50, 130], absLoss: [60, 250] },
};

const UNDERDOG_BONUS = 5;

// Permanent major-rank floors — Bronze through Diamond can't drop below these.
// Mythic+ uses a one-loss safety net only at major-rank boundaries, not sub-ranks.
const RANK_FLOORS = { Bronze: 0, Silver: 750, Gold: 1500, Diamond: 3000 };

// Match format: Mythic+ is Best of 3, below is Best of 1
export function getFormatForTier(tier) {
  return ["Mythic", "Legendary", "Masters", "Pro"].includes(tier) ? "Best of 3" : "Best of 1";
}

export function isSoloQueueOnly() {
  return false;
}

// Matchmaking offset per queue type
export function getMatchmakingOffset(queueType) {
  if (queueType === "duo") return 200;
  if (queueType === "trio") return 500;
  return 0;
}

export function getEffectiveEnemyElo(queueType, teammateElos = [], playerElo = 0) {
  const allElos = [playerElo, ...(teammateElos || [])]
    .map(Number)
    .filter((e) => !isNaN(e) && e > 0);
  if (allElos.length === 0) return Number(playerElo) || 0;
  return Math.max(...allElos) + getMatchmakingOffset(queueType);
}

function avgElo(elos) {
  const valid = (elos || []).filter((e) => Number(e) > 0).map(Number);
  if (!valid.length) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function getFloorForElo(elo, highestElo = 0) {
  const tier = getRank(elo).tier;
  let floor = RANK_FLOORS[tier] ?? 0;
  // Permanent Diamond safety net: once a player ever reached Diamond (>= 3000),
  // they can never drop below 3000 regardless of current tier.
  if ((Number(highestElo) || 0) >= RANK_FLOORS.Diamond) floor = Math.max(floor, RANK_FLOORS.Diamond);
  return floor;
}

function getMajorTierMin(tier) {
  const major = RANKS.find((r) => r.tier === tier && (r.roman === "I" || r.roman === ""));
  return major?.min ?? 0;
}

// Sub-rank index of an average enemy Elo (uses same RANKS boundaries)
function subRankIndexOfElo(elo) {
  if (!(elo > 0)) return null;
  return getRankIndex(elo);
}

// Standard expected-score curve (0..1); wider divisor -> flatter.
function expectedScore(playerElo, opponentElo) {
  if (opponentElo <= 0) return 0.5;
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
}

// Linear interpolate x in [0,1] between a and b
function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/**
 * Compute base Elo delta from tier bounds table.
 *
 * Behaviour:
 *  • Equal sub-rank (gap 0): position inside equal band via expScore.
 *      – Win:  favored (expScore≈1) → low end; upset (expScore≈0) → high end.
 *      – Loss: favored → high loss magnitude; upset → low loss magnitude.
 *  • Gap > 0 (enemy higher): extend beyond equal-band toward abs max.
 *      Wins pay more (underdog); losses cost less.
 *  • Gap < 0 (enemy lower): extend below equal-band toward abs min.
 *      Wins pay less; losses cost more.
 */
function baseDeltaFromBounds(tier, isWin, expScore, subRankGap) {
  const b = TIER_BOUNDS[tier] || TIER_BOUNDS.Diamond;

  if (isWin) {
    // Position inside equal band based on upset factor (1 - expScore)
    // upset=0 (heavy favorite) → equalWin[0]; upset=1 (huge upset) → equalWin[1]
    const upset = 1 - expScore;
    let delta = lerp(b.equalWin[0], b.equalWin[1], upset);

    if (subRankGap > 0) {
      // Enemy is higher-ranked — reward the upset outside the equal band.
      // Scale toward absWin[1]. Cap at 3 sub-ranks of separation for full swing.
      const t = Math.min(1, subRankGap / 3);
      delta = lerp(delta, b.absWin[1], t);
    } else if (subRankGap < 0) {
      // Enemy is lower-ranked — dampen gains below equal band toward absWin[0].
      const t = Math.min(1, -subRankGap / 3);
      delta = lerp(delta, b.absWin[0], t);
    }

    // Final absolute clamp
    return Math.max(b.absWin[0], Math.min(b.absWin[1], delta));
  }

  // Loss — return NEGATIVE delta.
  // Favored losses hurt more; upset losses hurt less.
  const favored = expScore; // 1 = heavy favorite → high loss magnitude
  let mag = lerp(b.equalLoss[0], b.equalLoss[1], favored);

  if (subRankGap > 0) {
    // Enemy higher-ranked — losing was expected; reduce toward absLoss[0].
    const t = Math.min(1, subRankGap / 3);
    mag = lerp(mag, b.absLoss[0], t);
  } else if (subRankGap < 0) {
    // Enemy lower-ranked — brutal loss, scale toward absLoss[1].
    const t = Math.min(1, -subRankGap / 3);
    mag = lerp(mag, b.absLoss[1], t);
  }

  mag = Math.max(b.absLoss[0], Math.min(b.absLoss[1], mag));
  return -mag;
}

// Premade skill confidence: [-0.12, 0.12]
function computePremadeAdjustment(teammateElos, teammateProfiles) {
  if (!teammateProfiles || teammateProfiles.length === 0) return 0;

  let total = 0;
  let count = 0;
  for (let i = 0; i < teammateElos.length; i++) {
    const profile = teammateProfiles[i];
    if (!profile) continue;
    const currentElo = Number(teammateElos[i]) || 0;
    if (currentElo <= 0) continue;
    const peakElo = Math.max(Number(profile.highestElo) || 0, Number(profile.lastSeasonElo) || 0);
    const trophies = Number(profile.trophies) || 0;
    if (peakElo <= 0 && trophies <= 0) continue;
    count++;
    if (peakElo > currentElo) total += ((peakElo - currentElo) / 1000) * 0.06;
    if (trophies > 0) total += Math.min(0.04, trophies / 1250000);
  }
  if (count === 0) return 0;
  return Math.max(-0.12, Math.min(0.12, total / count));
}

/**
 * Calculate Elo delta and new rating after a match.
 */
export function calculateElo(playerElo, opts = {}) {
  const current = Math.max(0, Number(playerElo) || 0);

  // Manual override
  if (opts.manualDelta !== undefined && opts.manualDelta !== null) {
    const delta = Number(opts.manualDelta) || 0;
    return { delta, eloAfter: Math.max(0, current + delta), details: { type: "manual", delta } };
  }

  const result = opts.result;
  const isWin = result === "victory";
  const isDraw = result === "draw";
  const rank = getRank(current);
  const tier = rank.tier;
  const bounds = TIER_BOUNDS[tier] || TIER_BOUNDS.Diamond;
  const queueType = opts.queueType || "solo";
  const highestElo = Number(opts.highestElo) || current;

  const enemyAvg = avgElo(opts.enemyElos);
  const teammateAvg = avgElo(opts.teammateElos);
  const teamSize = (opts.teammateElos?.length || 0) + 1;
  const teamAvg = teammateAvg > 0 ? (current + teammateAvg * (teamSize - 1)) / teamSize : current;

  // Season refresh — flat +100 / -30
  if (opts.seasonRefreshed) {
    const delta = isWin ? 100 : isDraw ? 0 : -30;
    return {
      delta,
      eloAfter: Math.max(0, current + delta),
      details: {
        type: "season_refresh",
        rankTier: tier,
        enemyAvg: Math.round(enemyAvg),
        teamAvg: Math.round(teamAvg),
        queueType,
        seasonRefreshed: true,
        format: getFormatForTier(tier),
      },
    };
  }

  // Sub-rank gap: enemyAvg sub-rank index − player sub-rank index.
  // Positive = enemy higher, negative = enemy lower.
  const playerSubIdx = getRankIndex(current);
  const enemySubIdx = subRankIndexOfElo(enemyAvg);
  const subRankGap = enemySubIdx == null ? 0 : enemySubIdx - playerSubIdx;

  const expScore = expectedScore(current, enemyAvg);

  // --- Draw path ---
  if (isDraw) {
    // Small delta biased by upset factor, capped tight.
    const raw = 15 * (0.5 - expScore);
    const draw = Math.round(Math.max(-20, Math.min(20, raw)));
    return {
      delta: draw,
      eloAfter: Math.max(0, current + draw),
      details: {
        type: "deep_analysis",
        band: "draw",
        subRankGap,
        expScore: Math.round(expScore * 100) / 100,
        rankTier: tier,
        enemyAvg: Math.round(enemyAvg),
        teamAvg: Math.round(teamAvg),
        eloDiff: Math.round(enemyAvg - current),
        queueType,
        matchmakingOffset: getMatchmakingOffset(queueType),
        format: getFormatForTier(tier),
      },
    };
  }

  // --- Base delta from tier bounds ---
  let delta = baseDeltaFromBounds(tier, isWin, expScore, subRankGap);

  // --- Star player: modest carry factor ---
  const isStarPlayer = opts.starPlayer === true || opts.starPlayer === "self";
  if (isStarPlayer) delta *= isWin ? 1.08 : 0.92;

  // --- Premade skill confidence ---
  const premadeAdjustment =
    (queueType === "duo" || queueType === "trio") && opts.teammateProfiles
      ? computePremadeAdjustment(opts.teammateElos || [], opts.teammateProfiles)
      : 0;
  if (premadeAdjustment !== 0) {
    if (isWin) delta *= 1 - premadeAdjustment;
    else delta *= 1 + premadeAdjustment;
  }

  // --- Ranked boost: +6% on victory if below previous peak ---
  const rankedBoost = isWin && current < highestElo;
  if (rankedBoost) delta *= 1.06;

  // --- Underdog bonus: exactly 1 sub-rank below enemy avg (even by 1 Elo) ---
  const isUnderdog = subRankGap >= 1;
  if (isUnderdog && subRankGap === 1) {
    // Player is the underdog — wins gain +5, losses lose 5 less
    if (isWin) delta += UNDERDOG_BONUS;
    else delta += UNDERDOG_BONUS; // delta is negative; adding reduces magnitude
  }

  // --- Final absolute clamp to tier bounds ---
  if (isWin) {
    delta = Math.max(bounds.absWin[0], Math.min(bounds.absWin[1], delta));
  } else {
    // delta is negative; magnitude must stay within absLoss bounds
    const mag = Math.max(bounds.absLoss[0], Math.min(bounds.absLoss[1], -delta));
    delta = -mag;
  }

  delta = Math.round(delta);
  let eloAfter = current + delta;

  // --- Floor protection ---
  if (!isWin) {
    const floor = getFloorForElo(current, highestElo);
    if (floor > 0 && eloAfter < floor) eloAfter = floor;

    // Mythic+ one-game safety net: only the MAJOR rank baseline catches a loss.
    // Example: 6030 Legendary I -> 6000, then the next loss can drop to Mythic III.
    // Sub-rank baselines such as Mythic II/III or Legendary II/III are not protected.
    if (["Mythic", "Legendary", "Masters", "Pro"].includes(tier)) {
      const majorBaseline = getMajorTierMin(tier);
      if (current > majorBaseline && eloAfter < majorBaseline) eloAfter = majorBaseline;
    }

  }

  eloAfter = Math.max(0, Math.round(eloAfter));
  delta = eloAfter - current;

  // Determine band label
  let band = "equal";
  if (subRankGap >= 2) band = isWin ? "upset_win" : "expected_loss";
  else if (subRankGap === 1) band = isWin ? "underdog_win" : "close_loss";
  else if (subRankGap <= -2) band = isWin ? "expected_win" : "upset_loss";
  else if (subRankGap === -1) band = isWin ? "favored_win" : "close_loss";

  return {
    delta,
    eloAfter,
    details: {
      type: "deep_analysis",
      band,
      subRankGap,
      expScore: Math.round(expScore * 100) / 100,
      rankTier: tier,
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
      format: getFormatForTier(tier),
    },
  };
}

export function checkRankUp(oldElo, newElo) {
  const oldRank = getRank(oldElo);
  const newRank = getRank(newElo);
  const oldIdx = getRankIndex(oldElo);
  const newIdx = getRankIndex(newElo);
  const isRankUp = newIdx > oldIdx;
  const isMajorRankUp = isRankUp && newRank.tier !== oldRank.tier;
  return { isRankUp, oldRank, newRank, isMajorRankUp };
}
