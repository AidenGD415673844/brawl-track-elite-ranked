// Brawler Lab — per-brawler analytics from the battle log.
import { MODES } from "@/lib/battleLog";

export function buildBrawlerStats(battleLog) {
  const map = new Map();
  for (const e of battleLog || []) {
    if (e.manual) continue;
    if (e.result !== "victory" && e.result !== "defeat") continue;
    const b = e.brawler || e.brawlers?.self;
    if (!b) continue;
    const row = map.get(b) || {
      name: b, w: 0, l: 0, games: 0, totalDelta: 0,
      modes: {}, trajectory: [], lastPlayed: null,
    };
    row.games++;
    row.totalDelta += (e.delta || 0);
    if (e.result === "victory") row.w++; else row.l++;
    const mode = e.mode || "Unknown";
    const m = row.modes[mode] || { w: 0, l: 0 };
    if (e.result === "victory") m.w++; else m.l++;
    row.modes[mode] = m;
    if (typeof e.eloAfter === "number") row.trajectory.push(e.eloAfter);
    if (!row.lastPlayed || new Date(e.timestamp) > new Date(row.lastPlayed)) row.lastPlayed = e.timestamp;
    map.set(b, row);
  }
  return Array.from(map.values()).map((r) => {
    const wr = r.games ? r.w / r.games : 0;
    const avgDelta = r.games ? Math.round(r.totalDelta / r.games) : 0;
    // Play score: WR weight + sample-size confidence + Elo pace
    const sampleConf = Math.min(1, r.games / 15);
    const paceBoost = Math.max(0, Math.min(1, (avgDelta + 20) / 60));
    const playScore = Math.round((wr * 60 + sampleConf * 25 + paceBoost * 15));
    // Best mode
    const bestMode = Object.entries(r.modes)
      .map(([m, s]) => ({ mode: m, games: s.w + s.l, wr: (s.w + s.l) ? s.w / (s.w + s.l) : 0 }))
      .filter((m) => m.games >= 2)
      .sort((a, b) => b.wr - a.wr)[0] || null;
    return {
      ...r,
      trajectory: r.trajectory.slice(-20),
      wr: Math.round(wr * 100),
      avgDelta,
      playScore,
      bestMode,
    };
  }).sort((a, b) => b.playScore - a.playScore);
}

// Recommend top-3 brawlers to queue right now.
export function recommendBrawlers(stats) {
  return stats
    .filter((s) => s.games >= 3)
    .slice(0, 3)
    .map((s) => ({ name: s.name, playScore: s.playScore, why: s.wr >= 55 ? `${s.wr}% WR` : `+${s.avgDelta} avg Elo` }));
}

// Pool gap analysis — flag modes with thin coverage.
export function poolGaps(stats) {
  const modeCounts = {};
  for (const m of MODES) modeCounts[m] = 0;
  for (const s of stats) {
    for (const mode of Object.keys(s.modes)) {
      if (modeCounts[mode] !== undefined) modeCounts[mode]++;
    }
  }
  return Object.entries(modeCounts).map(([mode, count]) => ({
    mode,
    count,
    risk: count === 0 ? "critical" : count === 1 ? "risky" : count <= 3 ? "ok" : "strong",
  }));
}

// Best teammate brawlers played alongside a given brawler.
export function bestTeammatesFor(battleLog, brawler) {
  const map = new Map();
  for (const e of battleLog || []) {
    if (e.manual) continue;
    if ((e.brawler || e.brawlers?.self) !== brawler) continue;
    const mates = ["mate1", "mate2"].map((k) => e.brawlers?.[k]).filter(Boolean);
    for (const m of mates) {
      const row = map.get(m) || { name: m, w: 0, g: 0 };
      row.g++;
      if (e.result === "victory") row.w++;
      map.set(m, row);
    }
  }
  return Array.from(map.values())
    .filter((r) => r.g >= 2)
    .map((r) => ({ ...r, wr: Math.round((r.w / r.g) * 100) }))
    .sort((a, b) => b.wr - a.wr)
    .slice(0, 5);
}

// Nightmare enemy matchups for a given self brawler.
export function nightmareFor(battleLog, brawler) {
  const map = new Map();
  for (const e of battleLog || []) {
    if (e.manual) continue;
    if ((e.brawler || e.brawlers?.self) !== brawler) continue;
    const enemies = ["enemy1", "enemy2", "enemy3"].map((k) => e.brawlers?.[k]).filter(Boolean);
    for (const en of enemies) {
      const row = map.get(en) || { name: en, w: 0, g: 0 };
      row.g++;
      if (e.result === "victory") row.w++;
      map.set(en, row);
    }
  }
  return Array.from(map.values())
    .filter((r) => r.g >= 2)
    .map((r) => ({ ...r, wr: Math.round((r.w / r.g) * 100) }))
    .sort((a, b) => a.wr - b.wr)
    .slice(0, 5);
}
