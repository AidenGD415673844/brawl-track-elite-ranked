const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

// Rank scale, bands, and color/tier utilities for the ranked tracker.
// Each sub-rank has its own distinct image asset.

// Rank icons — generated as inline SVG data URLs so they always render
// (the previous /__l5e/ CDN paths were unavailable outside Base44 hosting
// and showed as broken images on other environments).
//
// Each icon is a chunky shield in the tier's brand gradient with the tier
// initial + roman numeral stacked on top, matching Brawl Stars' visual
// hierarchy without pulling in external assets.
const TIER_ICON_STOPS = {
  Bronze:    ["#f59e0b", "#78350f"],
  Silver:    ["#e2e8f0", "#475569"],
  Gold:      ["#fde047", "#a16207"],
  Diamond:   ["#7dd3fc", "#075985"],
  Mythic:    ["#f0abfc", "#6b21a8"],
  Legendary: ["#fca5a5", "#7f1d1d"],
  Masters:   ["#fbbf24", "#7c2d12"],
  Pro:       ["#fef08a", "#b45309"],
};

function rankIconDataUrl(tier, roman) {
  const [c1, c2] = TIER_ICON_STOPS[tier] || ["#94a3b8", "#334155"];
  const initial = tier[0];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0%' stop-color='${c1}'/>
        <stop offset='100%' stop-color='${c2}'/>
      </linearGradient>
      <linearGradient id='rim' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0%' stop-color='rgba(255,255,255,0.65)'/>
        <stop offset='100%' stop-color='rgba(0,0,0,0.35)'/>
      </linearGradient>
    </defs>
    <path d='M50 6 L88 20 V52 C88 74 72 88 50 94 C28 88 12 74 12 52 V20 Z'
          fill='url(#g)' stroke='url(#rim)' stroke-width='3'/>
    <path d='M50 12 L82 24 V52 C82 70 68 82 50 87 C32 82 18 70 18 52 V24 Z'
          fill='none' stroke='rgba(0,0,0,0.35)' stroke-width='1.5'/>
    <text x='50' y='52' text-anchor='middle' font-family='Impact, "Arial Black", sans-serif'
          font-size='34' fill='white' stroke='rgba(0,0,0,0.55)' stroke-width='2'
          paint-order='stroke' font-weight='900'>${initial}</text>
    <text x='50' y='78' text-anchor='middle' font-family='Impact, "Arial Black", sans-serif'
          font-size='18' fill='white' stroke='rgba(0,0,0,0.55)' stroke-width='1.5'
          paint-order='stroke' font-weight='900'>${roman || ""}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const RANK_IMAGES = {
  "Bronze I":      rankIconDataUrl("Bronze", "I"),
  "Bronze II":     rankIconDataUrl("Bronze", "II"),
  "Bronze III":    rankIconDataUrl("Bronze", "III"),
  "Silver I":      rankIconDataUrl("Silver", "I"),
  "Silver II":     rankIconDataUrl("Silver", "II"),
  "Silver III":    rankIconDataUrl("Silver", "III"),
  "Gold I":        rankIconDataUrl("Gold", "I"),
  "Gold II":       rankIconDataUrl("Gold", "II"),
  "Gold III":      rankIconDataUrl("Gold", "III"),
  "Diamond I":     rankIconDataUrl("Diamond", "I"),
  "Diamond II":    rankIconDataUrl("Diamond", "II"),
  "Diamond III":   rankIconDataUrl("Diamond", "III"),
  "Mythic I":      rankIconDataUrl("Mythic", "I"),
  "Mythic II":     rankIconDataUrl("Mythic", "II"),
  "Mythic III":    rankIconDataUrl("Mythic", "III"),
  "Legendary I":   rankIconDataUrl("Legendary", "I"),
  "Legendary II":  rankIconDataUrl("Legendary", "II"),
  "Legendary III": rankIconDataUrl("Legendary", "III"),
  "Masters I":     rankIconDataUrl("Masters", "I"),
  "Masters II":    rankIconDataUrl("Masters", "II"),
  "Masters III":   rankIconDataUrl("Masters", "III"),
  "Pro":           rankIconDataUrl("Pro", ""),
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