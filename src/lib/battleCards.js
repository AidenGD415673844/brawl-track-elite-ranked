// Battle Card definitions — one card per major rank tier.
// Cards unlock when the player has ever reached that tier
// (via currentElo, highestElo, or lastSeasonElo).

import { TIER_COLORS, MAJOR_RANKS } from "@/lib/ranks";

// Tier-specific background gradients — rich, layered so cards read as
// premium even before animated overlays play. Higher tiers (Diamond+)
// get more depth and vignettes so they never feel empty.
export const TIER_BG = {
  Bronze:    "radial-gradient(ellipse at 50% 100%, rgba(146,64,14,0.55), transparent 58%), linear-gradient(180deg, #1b0802 0%, #401606 45%, #6b2709 100%)",
  Silver:    "radial-gradient(ellipse at 35% 20%, rgba(226,232,240,0.35), transparent 42%), radial-gradient(ellipse at 50% 100%, rgba(148,163,184,0.5), transparent 62%), linear-gradient(180deg, #172033 0%, #526173 48%, #aab5c2 100%)",
  Gold:      "radial-gradient(ellipse at 50% 100%, rgba(254,240,138,0.7), transparent 60%), linear-gradient(180deg, #78350f 0%, #d97706 38%, #fbbf24 100%)",
  Diamond:   "radial-gradient(ellipse at 50% 22%, #7dd3fc 0%, #0ea5e9 24%, #075985 58%, #07172f 100%)",
  Mythic:    "radial-gradient(ellipse at 50% 100%, rgba(217,70,239,0.75), transparent 58%), linear-gradient(180deg, #59118b 0%, #9827c8 42%, #2b0a46 100%)",
  Legendary: "radial-gradient(ellipse at 50% 100%, rgba(254,215,170,0.65), rgba(249,115,22,0.36) 30%, transparent 65%), linear-gradient(180deg, #8b1111 0%, #ef3b17 48%, #4b0909 100%)",
  Masters:   "radial-gradient(ellipse at 50% 25%, rgba(254,243,199,0.75), transparent 24%), radial-gradient(ellipse at 50% 100%, rgba(251,146,60,0.45), transparent 65%), linear-gradient(180deg, #713f12 0%, #b45309 45%, #241003 100%)",
  Pro:       "radial-gradient(ellipse at 50% 20%, rgba(254,249,195,0.9), transparent 24%), radial-gradient(ellipse at 50% 100%, rgba(250,204,21,0.72), transparent 62%), linear-gradient(180deg, #b45309 0%, #f97316 46%, #7f1d1d 100%)",
};

// Decorative overlay patterns per tier
export const TIER_DECOR = {
  Bronze:    "linear-gradient(0deg, rgba(0,0,0,0.42) 0 2px, transparent 2px 32px), linear-gradient(90deg, rgba(0,0,0,0.42) 0 2px, transparent 2px 64px), linear-gradient(90deg, rgba(0,0,0,0.32) 0 2px, transparent 2px 64px)",
  Silver:    "radial-gradient(ellipse 65% 42% at 24% 22%, rgba(255,255,255,0.28), transparent 70%), radial-gradient(ellipse 55% 38% at 72% 42%, rgba(255,255,255,0.18), transparent 70%), repeating-linear-gradient(115deg, transparent 0, transparent 18px, rgba(255,255,255,0.045) 18px, rgba(255,255,255,0.045) 20px)",
  Gold:      "conic-gradient(from 45deg at 50% 35%, transparent 0deg, rgba(255,255,255,0.12) 30deg, transparent 60deg, rgba(255,255,255,0.08) 90deg, transparent 120deg, rgba(255,255,255,0.1) 150deg, transparent 180deg, rgba(255,255,255,0.06) 210deg, transparent 240deg, rgba(255,255,255,0.1) 270deg, transparent 300deg, rgba(255,255,255,0.08) 330deg, transparent 360deg)",
  Diamond:   "radial-gradient(ellipse 90% 60% at 50% 100%, rgba(14,165,233,0.35), transparent 70%), repeating-linear-gradient(60deg, transparent 0, transparent 18px, rgba(255,255,255,0.05) 18px, rgba(255,255,255,0.05) 19px), repeating-linear-gradient(-60deg, transparent 0, transparent 18px, rgba(255,255,255,0.04) 18px, rgba(255,255,255,0.04) 19px)",
  Mythic:    "radial-gradient(ellipse 90% 55% at 50% 100%, rgba(217,70,239,0.45), transparent 70%), radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06) 0%, transparent 60%), conic-gradient(from 210deg at 50% 50%, transparent 0deg, rgba(232,121,249,0.12) 60deg, transparent 120deg, rgba(139,92,246,0.1) 180deg, transparent 240deg, rgba(232,121,249,0.08) 300deg, transparent 360deg)",
  Legendary: "radial-gradient(ellipse 100% 60% at 50% 100%, rgba(249,115,22,0.55), transparent 65%), radial-gradient(ellipse 60% 30% at 50% 90%, rgba(254,215,170,0.35), transparent 60%), linear-gradient(0deg, rgba(220,38,38,0.25) 0%, transparent 50%)",
  Masters:   "radial-gradient(ellipse 90% 55% at 50% 100%, rgba(251,191,36,0.5), transparent 70%), radial-gradient(ellipse 50% 25% at 50% 15%, rgba(254,243,199,0.35), transparent 70%), conic-gradient(from 90deg at 50% 100%, transparent 0deg, rgba(253,224,71,0.15) 60deg, transparent 120deg)",
  Pro:       "radial-gradient(ellipse 100% 60% at 50% 100%, rgba(250,204,21,0.55), transparent 70%), radial-gradient(ellipse 40% 20% at 50% 10%, rgba(254,249,195,0.4), transparent 70%), linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
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