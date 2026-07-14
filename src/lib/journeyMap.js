// Elo Journey Map — builds the trail data from battle log.
import { RANKS, getRank, TIER_COLORS } from "@/lib/ranks";

// Biome descriptor per tier — colors + terrain motif.
export const BIOMES = {
  Bronze:    { name: "Ochre Canyon",    top: "#2a1608", mid: "#7c3a10", horizon: "#f59e0b", motif: "canyon" },
  Silver:    { name: "Frozen Tundra",   top: "#0c1a24", mid: "#2f4256", horizon: "#cbd5e1", motif: "tundra" },
  Gold:      { name: "Sunlit Savanna",  top: "#2a1a02", mid: "#7a5510", horizon: "#fde047", motif: "savanna" },
  Diamond:   { name: "Aurora Glacier",  top: "#031425", mid: "#0e3a5c", horizon: "#7dd3fc", motif: "glacier" },
  Mythic:    { name: "Violet Nebula",   top: "#160423", mid: "#3d0d5c", horizon: "#e879f9", motif: "nebula" },
  Legendary: { name: "Ember Volcano",   top: "#1a0303", mid: "#5c0d0d", horizon: "#fca5a5", motif: "volcanic" },
  Masters:   { name: "Obsidian Ruins",  top: "#100000", mid: "#3a0808", horizon: "#fb923c", motif: "ruins" },
  Pro:       { name: "Celestial Throne",top: "#1a1000", mid: "#5c3a05", horizon: "#fcd34d", motif: "throne" },
};

// Build all data needed to render the map.
// Returns { series, width, height, biomes, minElo, maxElo, checkpoints, ravines }
export function buildJourney(battleLog, currentElo, { pxPerStep = 42, height = 260, padY = 30 } = {}) {
  const rated = (battleLog || []).filter((e) => !e.manual && typeof e.eloAfter === "number");
  // Chronological (oldest first)
  const chrono = [...rated].reverse();
  if (!chrono.length) {
    return { empty: true, biomes: [], series: [], width: 400, height, minElo: 0, maxElo: 0, checkpoints: [], ravines: [] };
  }

  const elos = chrono.map((e) => e.eloAfter);
  const minRaw = Math.min(...elos, currentElo);
  const maxRaw = Math.max(...elos, currentElo);
  const pad = Math.max(80, (maxRaw - minRaw) * 0.12);
  const minElo = Math.max(0, Math.floor((minRaw - pad) / 50) * 50);
  const maxElo = Math.ceil((maxRaw + pad) / 50) * 50;
  const range = Math.max(50, maxElo - minElo);

  const width = Math.max(560, chrono.length * pxPerStep + 80);
  const innerH = height - padY * 2;
  const eloToY = (elo) => padY + innerH - ((elo - minElo) / range) * innerH;

  // Detect losing streaks of ≥3 → ravines
  const ravines = [];
  let run = 0, runStart = 0;
  chrono.forEach((e, i) => {
    if (e.result === "defeat") {
      if (run === 0) runStart = i;
      run++;
    } else {
      if (run >= 3) ravines.push({ start: runStart, end: i - 1, length: run });
      run = 0;
    }
  });
  if (run >= 3) ravines.push({ start: runStart, end: chrono.length - 1, length: run });

  // Series with X positions
  const series = chrono.map((e, i) => {
    const x = 40 + i * pxPerStep;
    const y = eloToY(e.eloAfter);
    // Ravine dip modifier — visually push the point down inside a ravine
    const inRavine = ravines.some((r) => i >= r.start && i <= r.end);
    return { x, y, entry: e, i, rank: getRank(e.eloAfter), inRavine };
  });

  // Rank-up checkpoints — where tier changes vs previous
  const checkpoints = [];
  series.forEach((p, i) => {
    if (i === 0) return;
    const prevTier = series[i - 1].rank.tier;
    if (p.rank.tier !== prevTier && p.entry.result === "victory") {
      // only mark "up" transitions
      const tierOrder = ["Bronze","Silver","Gold","Diamond","Mythic","Legendary","Masters","Pro"];
      if (tierOrder.indexOf(p.rank.tier) > tierOrder.indexOf(prevTier)) {
        checkpoints.push({ x: p.x, y: p.y, rank: p.rank });
      }
    }
  });

  // Biome bands — contiguous vertical stripes labelled by tier at that x
  const biomes = [];
  let cursor = null;
  series.forEach((p, i) => {
    const tier = p.rank.tier;
    const xStart = i === 0 ? 0 : (series[i - 1].x + p.x) / 2;
    if (!cursor || cursor.tier !== tier) {
      if (cursor) { cursor.xEnd = xStart; biomes.push(cursor); }
      cursor = { tier, xStart, xEnd: xStart, biome: BIOMES[tier], colors: TIER_COLORS[tier] };
    }
  });
  if (cursor) { cursor.xEnd = width; biomes.push(cursor); }
  if (biomes.length) biomes[0].xStart = 0;

  // Smoothed path (simple Catmull-Rom → cubic beziers)
  const pts = series.map((p) => [p.x, p.y]);
  const path = catmullRomPath(pts);

  return { empty: false, series, path, width, height, minElo, maxElo, biomes, checkpoints, ravines, eloToY };
}

function catmullRomPath(points) {
  if (points.length < 2) return "";
  const p = points;
  let d = `M ${p[0][0]} ${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}
