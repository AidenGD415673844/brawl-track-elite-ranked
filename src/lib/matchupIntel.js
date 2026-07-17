// Matchup Intelligence — per-brawler win rates against enemy brawlers.
// Uses the battle log's brawlers.self + brawlers.enemyN fields.
export function buildMatchupMatrix(battleLog) {
  const cell = new Map(); // key: "self|enemy" -> { w, l }
  for (const e of battleLog || []) {
    if (e.manual) continue;
    if (e.result !== "victory" && e.result !== "defeat") continue;
    const self = e.brawler || e.brawlers?.self;
    if (!self) continue;
    const enemies = ["enemy1", "enemy2", "enemy3"]
      .map((k) => e.brawlers?.[k])
      .filter(Boolean);
    for (const en of enemies) {
      const key = `${self}|${en}`;
      const row = cell.get(key) || { self, enemy: en, w: 0, l: 0 };
      if (e.result === "victory") row.w++; else row.l++;
      cell.set(key, row);
    }
  }
  return Array.from(cell.values()).map((r) => ({
    ...r,
    games: r.w + r.l,
    rate: r.w + r.l > 0 ? r.w / (r.w + r.l) : 0,
  }));
}

// Enemy-brawler aggregate — flatten across your self choice.
export function buildEnemyMatchup(battleLog) {
  const cell = new Map();
  for (const e of battleLog || []) {
    if (e.manual) continue;
    if (e.result !== "victory" && e.result !== "defeat") continue;
    const enemies = ["enemy1", "enemy2", "enemy3"]
      .map((k) => e.brawlers?.[k])
      .filter(Boolean);
    for (const en of enemies) {
      const row = cell.get(en) || { enemy: en, w: 0, l: 0 };
      if (e.result === "victory") row.w++; else row.l++;
      cell.set(en, row);
    }
  }
  return Array.from(cell.values()).map((r) => ({
    ...r,
    games: r.w + r.l,
    rate: r.w + r.l > 0 ? r.w / (r.w + r.l) : 0,
  }));
}

export function confidenceLabel(games) {
  if (games >= 25) return { label: "Strong", color: "#22c55e" };
  if (games >= 10) return { label: "Solid",  color: "#eab308" };
  return { label: "Low", color: "#94a3b8" };
}

export function topMatchups(battleLog, { min = 5, take = 5 } = {}) {
  const rows = buildEnemyMatchup(battleLog).filter((r) => r.games >= min);
  const favored = [...rows].sort((a, b) => b.rate - a.rate).slice(0, take);
  const nightmare = [...rows].sort((a, b) => a.rate - b.rate).slice(0, take);
  return { favored, nightmare, total: rows.length };
}
