// Ranked tier configuration and seasonal reset logic.
// Tier rules sourced from the official Brawl Stars ranked table.
import { getRank, getRankIndex, RANKS } from "@/lib/ranks";

export const RANKED_TIERS = {
  Bronze: {
    name: "Bronze",
    eloRange: "0 – 749",
    format: "Best of 1",
    picking: "All Pick",
    brawlerReq: { count: 3, power: 9, label: "3× Power 9" },
    resetRule: "Bronze I",
  },
  Silver: {
    name: "Silver",
    eloRange: "750 – 1,499",
    format: "Best of 1",
    picking: "All Pick",
    brawlerReq: { count: 3, power: 9, label: "3× Power 9" },
    resetRule: "Silver I",
  },
  Gold: {
    name: "Gold",
    eloRange: "1,500 – 2,999",
    format: "Best of 1",
    picking: "All Pick",
    brawlerReq: { count: 3, power: 9, label: "3× Power 9" },
    resetRule: "Silver I",
  },
  Diamond: {
    name: "Diamond",
    eloRange: "3,000 – 4,499",
    format: "Best of 1",
    picking: "Ban + All Pick",
    brawlerReq: { count: 9, power: 9, label: "9× Power 9" },
    resetRule: "6 minor ranks lower",
  },
  Mythic: {
    name: "Mythic",
    eloRange: "4,500 – 5,999",
    format: "Best of 3",
    picking: "Ban + Turn Pick",
    brawlerReq: { count: 12, power: 11, label: "12× Power 11" },
    resetRule: "6 minor ranks lower",
  },
  Legendary: {
    name: "Legendary",
    eloRange: "6,000 – 8,249",
    format: "Best of 3",
    picking: "Ban + Turn Pick",
    brawlerReq: { count: 12, power: 11, label: "12× Power 11" },
    resetRule: "6 minor ranks lower",
  },
  Masters: {
    name: "Masters",
    eloRange: "8,250 – 11,249",
    format: "Best of 3",
    picking: "Ban + Turn Pick",
    brawlerReq: { count: 12, power: 11, label: "12× Power 11" },
    resetRule: "6 minor ranks lower",
  },
  Pro: {
    name: "Pro",
    eloRange: "11,250+",
    format: "Best of 3",
    picking: "Ban + Turn Pick",
    brawlerReq: { count: 12, power: 11, label: "12× Power 11" },
    resetRule: "6 minor ranks lower",
  },
};

/**
 * Compute the new starting Elo after a seasonal reset.
 * Uses the season peak Elo to determine the reset target.
 *
 * Rules (from official table):
 *   Bronze   → Bronze I  (0)
 *   Silver   → Silver I  (750)
 *   Gold     → Silver I  (750)
 *   Diamond+ → 6 minor ranks lower (clamped at Silver I)
 */
export function computeSeasonReset(peakElo) {
  const peakRank = getRank(peakElo);
  const tier = peakRank.tier;
  const tierConfig = RANKED_TIERS[tier];

  let newElo;
  let resetLabel;

  if (tier === "Bronze") {
    newElo = 0;
    resetLabel = "Bronze I";
  } else if (tier === "Silver" || tier === "Gold") {
    newElo = 750;
    resetLabel = "Silver I";
  } else {
    // Diamond+: drop 6 minor ranks from peak
    const peakIdx = getRankIndex(peakElo);
    const newIdx = Math.max(3, peakIdx - 6); // clamp at Silver I (index 3)
    const newRank = RANKS[newIdx];
    newElo = newRank.min;
    resetLabel = newRank.name;
  }

  return {
    newElo,
    resetLabel,
    oldRankName: peakRank.name,
    oldTier: tier,
    tierConfig,
  };
}