const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

// Rank scale, bands, and color/tier utilities for the ranked tracker.
// Each sub-rank has its own distinct image asset.

// Rank icons — original Brawl Stars-style badges uploaded by the user
// (brown skull = Bronze, blue-gray = Silver, yellow = Gold, blue = Diamond,
// purple = Mythic, red = Legendary, dark red = Masters, trophy = Pro).
// Hosted via Lovable Assets so URLs stay stable across environments.
import bronze1 from "@/assets/ranks/bronze-1.png.asset.json";
import bronze2 from "@/assets/ranks/bronze-2.png.asset.json";
import bronze3 from "@/assets/ranks/bronze-3.png.asset.json";
import silver1 from "@/assets/ranks/silver-1.png.asset.json";
import silver2 from "@/assets/ranks/silver-2.png.asset.json";
import silver3 from "@/assets/ranks/silver-3.png.asset.json";
import gold1   from "@/assets/ranks/gold-1.png.asset.json";
import gold2   from "@/assets/ranks/gold-2.png.asset.json";
import gold3   from "@/assets/ranks/gold-3.png.asset.json";
import diamond1 from "@/assets/ranks/diamond-1.png.asset.json";
import diamond2 from "@/assets/ranks/diamond-2.png.asset.json";
import diamond3 from "@/assets/ranks/diamond-3.png.asset.json";
import mythic1 from "@/assets/ranks/mythic-1.png.asset.json";
import mythic2 from "@/assets/ranks/mythic-2.png.asset.json";
import mythic3 from "@/assets/ranks/mythic-3.png.asset.json";
import legendary1 from "@/assets/ranks/legendary-1.png.asset.json";
import legendary2 from "@/assets/ranks/legendary-2.png.asset.json";
import legendary3 from "@/assets/ranks/legendary-3.png.asset.json";
import masters1 from "@/assets/ranks/masters-1.png.asset.json";
import masters2 from "@/assets/ranks/masters-2.png.asset.json";
import masters3 from "@/assets/ranks/masters-3.png.asset.json";
import proIcon  from "@/assets/ranks/pro.png.asset.json";

const RANK_IMAGES = {
  "Bronze I":      bronze1.url,
  "Bronze II":     bronze2.url,
  "Bronze III":    bronze3.url,
  "Silver I":      silver1.url,
  "Silver II":     silver2.url,
  "Silver III":    silver3.url,
  "Gold I":        gold1.url,
  "Gold II":       gold2.url,
  "Gold III":      gold3.url,
  "Diamond I":     diamond1.url,
  "Diamond II":    diamond2.url,
  "Diamond III":   diamond3.url,
  "Mythic I":      mythic1.url,
  "Mythic II":     mythic2.url,
  "Mythic III":    mythic3.url,
  "Legendary I":   legendary1.url,
  "Legendary II":  legendary2.url,
  "Legendary III": legendary3.url,
  "Masters I":     masters1.url,
  "Masters II":    masters2.url,
  "Masters III":   masters3.url,
  "Pro":           proIcon.url,
};


// TIER_IMAGES kept for backward compat — points to the I sub-rank image of each tier
export const TIER_IMAGES = {
  Bronze:    RANK_IMAGES["Bronze I"],
  Silver:    RANK_IMAGES["Silver I"],
  Gold:      RANK_IMAGES["Gold I"],
  Diamond:   RANK_IMAGES["Diamond I"],
  Mythic:    RANK_IMAGES["Mythic I"],
  Legendary: RANK_IMAGES["Legendary I"],
  Masters:   RANK_IMAGES["Masters I"],
  Pro:       RANK_IMAGES["Pro"],
};

export const RANKS = [
  { name: "Bronze I",      tier: "Bronze",    roman: "I",   min: 0,     max: 249,      image: RANK_IMAGES["Bronze I"] },
  { name: "Bronze II",     tier: "Bronze",    roman: "II",  min: 250,   max: 499,      image: RANK_IMAGES["Bronze II"] },
  { name: "Bronze III",    tier: "Bronze",    roman: "III", min: 500,   max: 749,      image: RANK_IMAGES["Bronze III"] },
  { name: "Silver I",      tier: "Silver",    roman: "I",   min: 750,   max: 999,      image: RANK_IMAGES["Silver I"] },
  { name: "Silver II",     tier: "Silver",    roman: "II",  min: 1000,  max: 1249,     image: RANK_IMAGES["Silver II"] },
  { name: "Silver III",    tier: "Silver",    roman: "III", min: 1250,  max: 1499,     image: RANK_IMAGES["Silver III"] },
  { name: "Gold I",        tier: "Gold",      roman: "I",   min: 1500,  max: 1999,     image: RANK_IMAGES["Gold I"] },
  { name: "Gold II",       tier: "Gold",      roman: "II",  min: 2000,  max: 2499,     image: RANK_IMAGES["Gold II"] },
  { name: "Gold III",      tier: "Gold",      roman: "III", min: 2500,  max: 2999,     image: RANK_IMAGES["Gold III"] },
  { name: "Diamond I",     tier: "Diamond",   roman: "I",   min: 3000,  max: 3499,     image: RANK_IMAGES["Diamond I"] },
  { name: "Diamond II",    tier: "Diamond",   roman: "II",  min: 3500,  max: 3999,     image: RANK_IMAGES["Diamond II"] },
  { name: "Diamond III",   tier: "Diamond",   roman: "III", min: 4000,  max: 4499,     image: RANK_IMAGES["Diamond III"] },
  { name: "Mythic I",      tier: "Mythic",    roman: "I",   min: 4500,  max: 4999,     image: RANK_IMAGES["Mythic I"] },
  { name: "Mythic II",     tier: "Mythic",    roman: "II",  min: 5000,  max: 5499,     image: RANK_IMAGES["Mythic II"] },
  { name: "Mythic III",    tier: "Mythic",    roman: "III", min: 5500,  max: 5999,     image: RANK_IMAGES["Mythic III"] },
  { name: "Legendary I",   tier: "Legendary", roman: "I",   min: 6000,  max: 6749,     image: RANK_IMAGES["Legendary I"] },
  { name: "Legendary II",  tier: "Legendary", roman: "II",  min: 6750,  max: 7499,     image: RANK_IMAGES["Legendary II"] },
  { name: "Legendary III", tier: "Legendary", roman: "III", min: 7500,  max: 8249,     image: RANK_IMAGES["Legendary III"] },
  { name: "Masters I",     tier: "Masters",   roman: "I",   min: 8250,  max: 9249,     image: RANK_IMAGES["Masters I"] },
  { name: "Masters II",    tier: "Masters",   roman: "II",  min: 9250,  max: 10249,    image: RANK_IMAGES["Masters II"] },
  { name: "Masters III",   tier: "Masters",   roman: "III", min: 10250, max: 11249,    image: RANK_IMAGES["Masters III"] },
  { name: "Pro",           tier: "Pro",       roman: "",    min: 11250, max: Infinity,  image: RANK_IMAGES["Pro"] },
];

export const TIER_COLORS = {
  Bronze:    { from: "#b45309", to: "#f59e0b", text: "#fbbf24", glow: "rgba(180,83,9,0.45)" },
  Silver:    { from: "#64748b", to: "#cbd5e1", text: "#e2e8f0", glow: "rgba(148,163,184,0.45)" },
  Gold:      { from: "#ca8a04", to: "#fde047", text: "#fde047", glow: "rgba(234,179,8,0.5)" },
  Diamond:   { from: "#0284c7", to: "#38bdf8", text: "#7dd3fc", glow: "rgba(56,189,248,0.55)" },
  Mythic:    { from: "#9333ea", to: "#d946ef", text: "#e879f9", glow: "rgba(168,85,247,0.55)" },
  Legendary: { from: "#dc2626", to: "#f87171", text: "#fca5a5", glow: "rgba(239,68,68,0.55)" },
  Masters:   { from: "#7f1d1d", to: "#ea580c", text: "#fb923c", glow: "rgba(220,38,38,0.6)" },
  Pro:       { from: "#b45309", to: "#fbbf24", text: "#fcd34d", glow: "rgba(245,158,11,0.65)" },
};

export function getRank(elo) {
  const e = Number(elo) || 0;
  for (const r of RANKS) {
    if (e >= r.min && e <= r.max) return r;
  }
  return RANKS[RANKS.length - 1];
}

export function getRankIndex(elo) {
  const rank = getRank(elo);
  return RANKS.findIndex((r) => r.name === rank.name);
}

export function tierColor(elo) {
  return TIER_COLORS[getRank(elo).tier];
}

// Progress within the current rank band (0..1)
export function rankProgress(elo) {
  const r = getRank(elo);
  if (!isFinite(r.max)) return 1;
  const span = r.max - r.min;
  if (span <= 0) return 0;
  return Math.min(1, Math.max(0, (elo - r.min) / span));
}

// Progress through the entire tier (all sub-ranks combined, 0..1)
export function tierProgress(elo) {
  const r = getRank(elo);
  const tierRanks = RANKS.filter((rr) => rr.tier === r.tier);
  const tierMin = tierRanks[0].min;
  const tierMax = tierRanks[tierRanks.length - 1].max;
  if (!isFinite(tierMax)) return 1;
  const span = tierMax - tierMin;
  if (span <= 0) return 0;
  return Math.min(1, Math.max(0, (elo - tierMin) / span));
}

// Key Elo thresholds for milestone tracking
export const KEY_THRESHOLDS = [1000, 3000, 4500, 6000, 8250, 11250];

// Major ranks — one entry per tier, for major-rank-only carousel navigation
export const MAJOR_RANKS = RANKS.filter((r) => r.roman === "I" || r.roman === "");