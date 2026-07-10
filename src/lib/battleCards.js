// Battle Card definitions — one card per major rank tier.
// Cards unlock when the player has ever reached that tier
// (via currentElo, highestElo, or lastSeasonElo).

import { TIER_COLORS, MAJOR_RANKS } from "@/lib/ranks";

// Tier-specific background gradients — rich, layered so cards read as
// premium even before animated overlays play. Higher tiers (Diamond+)
// get more depth and vignettes so they never feel empty.
export const TIER_BG = {
  Bronze:    "linear-gradient(180deg, #3D1A0A 0%, #9A3412 40%, #C2410C 100%)",
  Silver:    "linear-gradient(180deg, #1E293B 0%, #475569 45%, #94A3B8 100%)",
  Gold:      "linear-gradient(180deg, #78350F 0%, #D97706 35%, #FBBF24 100%)",
  Diamond:   "radial-gradient(ellipse at 50% 20%, #7DD3FC 0%, #0EA5E9 22%, #075985 55%, #0C1F3B 100%)",
  Mythic:    "radial-gradient(ellipse at 50% 25%, #F0ABFC 0%, #C026D3 20%, #6B21A8 55%, #1E0940 100%)",
  Legendary: "radial-gradient(ellipse at 50% 25%, #FED7AA 0%, #F97316 18%, #B91C1C 55%, #3F0808 100%)",
  Masters:   "radial-gradient(ellipse at 50% 25%, #FEF3C7 0%, #FBBF24 18%, #92400E 55%, #1C0F04 100%)",
  Pro:       "radial-gradient(ellipse at 50% 25%, #FEF9C3 0%, #FBBF24 15%, #EA580C 45%, #7F1D1D 80%, #1E0505 100%)",
};

// Decorative overlay patterns per tier
export const TIER_DECOR = {
  Bronze:    "repeating-linear-gradient(135deg, transparent 0, transparent 12px, rgba(0,0,0,0.06) 12px, rgba(0,0,0,0.06) 13px)",
  Silver:    "radial-gradient(ellipse 60% 40% at 30% 25%, rgba(255,255,255,0.2), transparent 70%), radial-gradient(ellipse 50% 35% at 70% 40%, rgba(255,255,255,0.15), transparent 70%)",
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