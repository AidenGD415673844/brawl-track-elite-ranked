// Battle Card definitions — one card per major rank tier.
// Cards unlock when the player has ever reached that tier
// (via currentElo, highestElo, or lastSeasonElo).

import { TIER_COLORS, MAJOR_RANKS } from "@/lib/ranks";

// Tier-specific background gradients — designed to match the official
// Brawl Stars battle card aesthetic without using image assets.
export const TIER_BG = {
  Bronze:    "linear-gradient(180deg, #3D1A0A 0%, #9A3412 40%, #C2410C 100%)",
  Silver:    "linear-gradient(180deg, #1E293B 0%, #475569 45%, #94A3B8 100%)",
  Gold:      "linear-gradient(180deg, #78350F 0%, #D97706 35%, #FBBF24 100%)",
  Diamond:   "linear-gradient(180deg, #0C4A6E 0%, #0284C7 45%, #38BDF8 100%)",
  Mythic:    "linear-gradient(180deg, #2E1065 0%, #6B21A8 40%, #A21CAF 100%)",
  Legendary: "linear-gradient(180deg, #450A0A 0%, #991B1B 40%, #DC2626 100%)",
  Masters:   "linear-gradient(180deg, #292524 0%, #57534E 45%, #A8A29E 100%)",
  Pro:       "linear-gradient(180deg, #14532D 0%, #15803D 45%, #22C55E 100%)",
};

// Decorative overlay patterns per tier — adds visual texture
// that matches each tier's theme (flames, crystal shards, light rays, etc.)
export const TIER_DECOR = {
  Bronze:    "repeating-linear-gradient(135deg, transparent 0, transparent 12px, rgba(0,0,0,0.06) 12px, rgba(0,0,0,0.06) 13px)",
  Silver:    "radial-gradient(ellipse 60% 40% at 30% 25%, rgba(255,255,255,0.2), transparent 70%), radial-gradient(ellipse 50% 35% at 70% 40%, rgba(255,255,255,0.15), transparent 70%)",
  Gold:      "conic-gradient(from 45deg at 50% 35%, transparent 0deg, rgba(255,255,255,0.12) 30deg, transparent 60deg, rgba(255,255,255,0.08) 90deg, transparent 120deg, rgba(255,255,255,0.1) 150deg, transparent 180deg, rgba(255,255,255,0.06) 210deg, transparent 240deg, rgba(255,255,255,0.1) 270deg, transparent 300deg, rgba(255,255,255,0.08) 330deg, transparent 360deg)",
  Diamond:   "repeating-linear-gradient(60deg, transparent 0, transparent 14px, rgba(255,255,255,0.07) 14px, rgba(255,255,255,0.07) 15px), repeating-linear-gradient(-60deg, transparent 0, transparent 14px, rgba(255,255,255,0.05) 14px, rgba(255,255,255,0.05) 15px)",
  Mythic:    "radial-gradient(ellipse 70% 50% at 50% 75%, rgba(217,70,239,0.35), transparent 65%), radial-gradient(ellipse 50% 30% at 50% 90%, rgba(236,72,153,0.25), transparent 60%)",
  Legendary: "linear-gradient(0deg, rgba(249,115,22,0.45) 0%, rgba(249,115,22,0.15) 20%, transparent 40%)",
  Masters:   "radial-gradient(ellipse 60% 40% at 40% 30%, rgba(231,229,228,0.12), transparent 70%), radial-gradient(ellipse 50% 35% at 65% 50%, rgba(214,211,209,0.1), transparent 70%)",
  Pro:       "linear-gradient(45deg, transparent 35%, rgba(255,255,255,0.08) 50%, transparent 65%)",
};

export const BATTLE_CARDS = MAJOR_RANKS.map((rank) => ({
  tier: rank.tier,
  name: `${rank.tier} Battle Card`,
  minElo: rank.min,
  image: rank.image,
  color: TIER_COLORS[rank.tier],
}));

// A card is unlocked if the player has EVER hit that tier —
// current Elo, all-time peak, or last-season highest all count.
export function isCardUnlocked(card, player) {
  const peakElo = Math.max(
    player.currentElo || 0,
    player.highestElo || 0,
    player.lastSeasonElo || 0
  );
  return peakElo >= card.minElo;
}

export function getUnlockedCards(player) {
  return BATTLE_CARDS.filter((card) => isCardUnlocked(card, player));
}

export function getEquippedCard(player) {
  if (!player.equippedCard) return null;
  return BATTLE_CARDS.find((card) => card.tier === player.equippedCard) || null;
}