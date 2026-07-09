const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

// Rank scale, bands, and color/tier utilities for the ranked tracker.
// Each sub-rank has its own distinct image asset.

// Individual sub-rank images — ordered I, II, III per tier
const RANK_IMAGES = {
  "Bronze I":      "/__l5e/assets-v1/bc4d1fce-7506-4029-ad9d-3195e6110056/IMG_1357.png",
  "Bronze II":     "/__l5e/assets-v1/ddb8507e-d0c3-4738-b3d2-920523478941/IMG_1356.png",
  "Bronze III":    "/__l5e/assets-v1/425d4e48-7f77-4404-a749-70fd78da66fe/IMG_1355.png",
  "Silver I":      "/__l5e/assets-v1/1990f39c-5fc8-4252-b36a-32139bcf1d93/IMG_1354.png",
  "Silver II":     "/__l5e/assets-v1/ce35b435-4ec4-4b49-9ddd-1eec4bc0ab6f/IMG_1353.png",
  "Silver III":    "/__l5e/assets-v1/462e3f9e-36dc-43ea-897a-0c17fd1b32c0/IMG_1352.png",
  "Gold I":        "/__l5e/assets-v1/c261a606-bc90-4834-8217-8b9d20b348e7/IMG_1351.png",
  "Gold II":       "/__l5e/assets-v1/a7076a7e-8506-4bb2-b64a-3ec694538824/IMG_1350.png",
  "Gold III":      "/__l5e/assets-v1/4995f95a-a8eb-4557-9b4b-5998865056d4/IMG_1349.png",
  "Diamond I":     "/__l5e/assets-v1/f5004267-2b3e-45f4-bbdf-90c9eed72f02/IMG_1348.png",
  "Diamond II":    "/__l5e/assets-v1/271d3bec-9931-4621-ad75-1a719be33cf4/IMG_1347.png",
  "Diamond III":   "/__l5e/assets-v1/1372bf67-4eac-42a8-a745-1d4a9f9267c5/IMG_1346.png",
  "Mythic I":      "/__l5e/assets-v1/f95b93fd-f3b4-4f24-8429-c8c7dc770943/IMG_1345.png",
  "Mythic II":     "/__l5e/assets-v1/a8c8c627-9ea4-44fc-80f3-a018d09915fb/IMG_1344.png",
  "Mythic III":    "/__l5e/assets-v1/ce550d9f-6efb-4c55-8f43-a52db8aa1773/IMG_1343.png",
  "Legendary I":   "/__l5e/assets-v1/3b972475-5ce8-4dbc-b0c8-50148e4e5883/IMG_1342.png",
  "Legendary II":  "/__l5e/assets-v1/1ee4f875-8c0f-4329-8740-eb1afbc85508/IMG_1341.png",
  "Legendary III": "/__l5e/assets-v1/9e3eb9e0-c4f4-4ece-919f-9276b6cf5d7f/IMG_1340.png",
  "Masters I":     "/__l5e/assets-v1/dc4b35d0-1524-4afb-a9c8-66c62135a391/IMG_1339.png",
  "Masters II":    "/__l5e/assets-v1/cba4c399-86a0-4812-9fbc-50611436e260/IMG_1338.png",
  "Masters III":   "/__l5e/assets-v1/aac66757-f507-4b81-8422-350c3d01f464/IMG_1337.png",
  "Pro":           "/__l5e/assets-v1/381bb0fd-3508-4ee6-91b1-574efc3acdd4/IMG_1336.png",
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