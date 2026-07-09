// Rank frequency tracking — how many times the player has reached each tier.
// Stored in localStorage as { tier: count }.
// Used by SeasonEndReport to display escalating visual effects.

const FREQ_KEY = "ranked_rank_frequency_v1";

export const TRACKED_TIERS = [
  "Bronze", "Silver", "Gold", "Diamond",
  "Mythic", "Legendary", "Masters", "Pro",
];

export function getRankFrequency() {
  try {
    const raw = localStorage.getItem(FREQ_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setRankFrequency(tier, count) {
  const freq = getRankFrequency();
  freq[tier] = Math.max(0, Math.min(99, Math.floor(Number(count) || 0)));
  localStorage.setItem(FREQ_KEY, JSON.stringify(freq));
  return freq;
}

export function setAllRankFrequency(freqMap) {
  const cleaned = {};
  for (const tier of TRACKED_TIERS) {
    cleaned[tier] = Math.max(0, Math.min(99, Math.floor(Number(freqMap[tier]) || 0)));
  }
  localStorage.setItem(FREQ_KEY, JSON.stringify(cleaned));
  return cleaned;
}

export function incrementRankFrequency(tier) {
  const freq = getRankFrequency();
  freq[tier] = (freq[tier] || 0) + 1;
  localStorage.setItem(FREQ_KEY, JSON.stringify(freq));
  return freq;
}

// Returns the effect level for a tier based on frequency count:
// 0 = not reached, 1 = base icon, 2 = glow, 3 = particles, 4 = mastery frame (cap)
export function getEffectLevel(count) {
  if (!count || count < 1) return 0;
  return Math.min(4, count);
}