// Team Restrictions in Ranked — based on the HIGHEST-ranked player in the party.
//   Bronze I – Diamond III  (idx 0–11):  ±8 ranks
//   Mythic I – Masters I    (idx 12–18): ±3 ranks
//   Masters II – Pro        (idx 19–21): ±1 rank
import { getRankIndex, getRank, RANKS } from "@/lib/ranks";

const RESTRICTION_BANDS = [
  { maxIdx: 11, gap: 8, label: "Bronze I – Diamond III" },
  { maxIdx: 18, gap: 3, label: "Mythic I – Masters I" },
  { maxIdx: 21, gap: 1, label: "Masters II – Pro" },
];

export const TEAM_RESTRICTIONS = RESTRICTION_BANDS.map((b) => ({
  ...b,
  minRank: RANKS[0].name,
}));

export function getRankRestriction(rankIdx) {
  for (const band of RESTRICTION_BANDS) {
    if (rankIdx <= band.maxIdx) return band.gap;
  }
  return 1;
}

export function getRestrictionBand(rankIdx) {
  for (const band of RESTRICTION_BANDS) {
    if (rankIdx <= band.maxIdx) return band;
  }
  return RESTRICTION_BANDS[RESTRICTION_BANDS.length - 1];
}

// Returns the allowed sub-rank index range for a player at the given index.
export function getSubrankLimits(playerIdx) {
  const gap = getRankRestriction(playerIdx);
  return {
    minIdx: Math.max(0, playerIdx - gap),
    maxIdx: Math.min(RANKS.length - 1, playerIdx + gap),
  };
}

export function getMaxAllowedGap(playerIdx) {
  return getRankRestriction(playerIdx);
}

// Below Diamond I players can team with Diamond+ only if they have 9+ Power 9 brawlers.
export function checkPowerQualification(memberElos = [], power9Brawlers = 0) {
  const elos = memberElos.map(Number).filter((e) => !isNaN(e) && e > 0);
  if (elos.length === 0) return { qualified: true };

  const indices = elos.map(getRankIndex);
  const highestIdx = Math.max(...indices);
  const hasDiamondPlus = highestIdx >= 9; // Diamond I = index 9

  if (!hasDiamondPlus) return { qualified: true };

  const belowDiamond = indices.some((idx) => idx < 9);
  if (!belowDiamond) return { qualified: true };

  if (power9Brawlers < 9) {
    return {
      qualified: false,
      needed: 9 - power9Brawlers,
      message: `Players below Diamond I need 9+ Power 9 brawlers to queue with Diamond+ ranks (${power9Brawlers}/9).`,
    };
  }
  return { qualified: true };
}

// Cross-tier matchmaking rules for pre-made teams.
// Gold/below cannot play with Diamond randoms/enemies; pre-made Diamond teammates
// are allowed only if at least 1 enemy is Diamond.
// Diamond cannot play with Mythic randoms/enemies; pre-made Mythic teammates
// are allowed only if at least 1 enemy is Mythic.
function validateCrossTierRules(playerElo, teammateElos, enemyElos, queueType) {
  const playerIdx = getRankIndex(playerElo);

  // Pre-made teammate indices: duo → [0], trio → [0,1], solo → []
  const premadeIndices =
    queueType === "duo" ? [0] : queueType === "trio" ? [0, 1] : [];

  const isGoldOrBelow = playerIdx <= 8; // Bronze I – Gold III
  const isDiamond = playerIdx >= 9 && playerIdx <= 11; // Diamond I – Diamond III

  // --- Gold or below: Diamond restrictions ---
  if (isGoldOrBelow) {
    const inDiamond = (elo) => {
      const idx = getRankIndex(elo);
      return idx >= 9 && idx <= 11;
    };

    // Enemies cannot be Diamond
    for (const e of enemyElos) {
      if (inDiamond(e)) {
        return {
          valid: false,
          message: `Lobby Configuration Error: ${getRank(e).name} enemy is not allowed — enemies cannot be Diamond unless you are Diamond.`,
        };
      }
    }

    // Random teammates cannot be Diamond
    for (let i = 0; i < teammateElos.length; i++) {
      if (premadeIndices.includes(i)) continue;
      if (inDiamond(teammateElos[i])) {
        return {
          valid: false,
          message: `Lobby Configuration Error: ${getRank(teammateElos[i]).name} random teammate is not allowed — randoms cannot be Diamond unless you are Diamond.`,
        };
      }
    }

    // Pre-made Diamond teammates require at least 1 Diamond enemy
    const hasDiamondPremade = teammateElos.some(
      (e, i) => premadeIndices.includes(i) && inDiamond(e)
    );
    if (hasDiamondPremade && !enemyElos.some(inDiamond)) {
      return {
        valid: false,
        message: `Lobby Configuration Error: Pre-made Diamond teammate requires at least 1 Diamond enemy in the lobby.`,
      };
    }
  }

  // --- Diamond: Mythic restrictions ---
  if (isDiamond) {
    const inMythic = (elo) => {
      const idx = getRankIndex(elo);
      return idx >= 12 && idx <= 14;
    };

    // Enemies cannot be Mythic
    for (const e of enemyElos) {
      if (inMythic(e)) {
        return {
          valid: false,
          message: `Lobby Configuration Error: ${getRank(e).name} enemy is not allowed — enemies cannot be Mythic unless you are Mythic.`,
        };
      }
    }

    // Random teammates cannot be Mythic
    for (let i = 0; i < teammateElos.length; i++) {
      if (premadeIndices.includes(i)) continue;
      if (inMythic(teammateElos[i])) {
        return {
          valid: false,
          message: `Lobby Configuration Error: ${getRank(teammateElos[i]).name} random teammate is not allowed — randoms cannot be Mythic unless you are Mythic.`,
        };
      }
    }

    // Pre-made Mythic teammates require at least 1 Mythic enemy
    const hasMythicPremade = teammateElos.some(
      (e, i) => premadeIndices.includes(i) && inMythic(e)
    );
    if (hasMythicPremade && !enemyElos.some(inMythic)) {
      return {
        valid: false,
        message: `Lobby Configuration Error: Pre-made Mythic teammate requires at least 1 Mythic enemy in the lobby.`,
      };
    }
  }

  return { valid: true };
}

// Validates the entire lobby (all players incl. enemies) against rank restrictions.
export function validateLobby(playerElo, teammateElos = [], enemyElos = [], queueType = "solo") {
  const allElos = [playerElo, ...teammateElos, ...enemyElos]
    .map(Number)
    .filter((e) => !isNaN(e) && e > 0);

  if (allElos.length === 0) return { valid: true };

  const indices = allElos.map(getRankIndex);
  const highestIdx = Math.max(...indices);
  const gap = getRankRestriction(highestIdx);
  const highestRank = RANKS[highestIdx];

  for (let i = 0; i < allElos.length; i++) {
    if (Math.abs(indices[i] - highestIdx) > gap) {
      const offenderRank = getRank(allElos[i]);
      return {
        valid: false,
        message: `Lobby Configuration Error: ${offenderRank.name} is outside the ±${gap} rank restriction for ${highestRank.name}.`,
      };
    }
  }

  // Cross-tier rules (Gold↔Diamond, Diamond↔Mythic)
  const crossTier = validateCrossTierRules(playerElo, teammateElos, enemyElos, queueType);
  if (!crossTier.valid) return crossTier;

  return { valid: true };
}

// Validates team composition for matchmaking.
// Returns { canQueue, violations, tier, maxGap, matchmakingOffset }.
export function canQueue(queueType, members = [], enemies = [], power9Brawlers = null) {
  const memberElos = members.map(Number).filter((e) => !isNaN(e) && e > 0);

  if (memberElos.length === 0)
    return { canQueue: true, violations: [], tier: null, maxGap: null, matchmakingOffset: 0 };

  const playerElo = memberElos[0];
  const playerRank = getRank(playerElo);
  const playerTier = playerRank.tier;

  // Restriction is based on the HIGHEST-ranked team member
  const memberIndices = memberElos.map(getRankIndex);
  const highestIdx = Math.max(...memberIndices);
  const gap = getRankRestriction(highestIdx);
  const highestRank = RANKS[highestIdx];

  const violations = [];
  const labels = ["You", "Teammate 1", "Teammate 2"];

  for (let i = 0; i < memberElos.length; i++) {
    if (Math.abs(memberIndices[i] - highestIdx) > gap) {
      const offenderRank = getRank(memberElos[i]);
      violations.push(
        `${labels[i] || `Member ${i}`} (${offenderRank.name}, ${memberElos[i].toLocaleString()}) is outside the ±${gap} rank limit for ${highestRank.name}`
      );
    }
  }

  // Power qualification: below-Diamond players teaming with Diamond+ need 9+ Power 9
  if (power9Brawlers !== null) {
    const powerCheck = checkPowerQualification(memberElos, power9Brawlers);
    if (!powerCheck.qualified) {
      violations.push(powerCheck.message);
    }
  }

  // Matchmaking offset: Duo +200, Trio +500 (official Ranked 3.0 rules)
  const matchmakingOffset = queueType === "duo" ? 200 : queueType === "trio" ? 500 : 0;

  return {
    canQueue: violations.length === 0,
    violations,
    tier: playerTier,
    maxGap: gap,
    matchmakingOffset,
  };
}