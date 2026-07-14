// Clutch Index engine — measures pressure per battle and aggregates
// a "did you win when it mattered" score. Pure functions, no side effects.
import { getRank, RANKS } from "@/lib/ranks";

// Weights sum to 1.0
const W_STREAK = 0.35;
const W_DIFF = 0.25;
const W_BORDER = 0.25;
const W_FORM = 0.15;

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

// Distance (in Elo) from a given elo to the nearest sub-rank boundary
// (either the floor of the current band or the ceiling).
export function borderProximity(elo) {
  const r = getRank(elo);
  const floorDist = elo - r.min;
  const ceilDist = isFinite(r.max) ? r.max - elo : 9999;
  const nearest = Math.min(floorDist, ceilDist);
  // ≤75 Elo from a border → maxed pressure; scales linearly to 250 Elo.
  if (nearest <= 75) return 100;
  if (nearest >= 250) return 10;
  return Math.round(100 - ((nearest - 75) / 175) * 90);
}

// Losing/winning streak leading into (but not including) the given index.
// Log is newest-first (matches loadBattleLog).
function streakInto(log, idx) {
  let s = 0;
  for (let i = idx + 1; i < log.length; i++) {
    const e = log[i];
    if (e.manual) continue;
    if (e.result === "victory") { if (s < 0) break; s++; }
    else if (e.result === "defeat") { if (s > 0) break; s--; }
    else break;
    if (Math.abs(s) >= 12) break;
  }
  return s;
}

function last10WinRate(log, idx) {
  const rated = [];
  for (let i = idx + 1; i < log.length && rated.length < 10; i++) {
    if (!log[i].manual && (log[i].result === "victory" || log[i].result === "defeat")) rated.push(log[i]);
  }
  if (!rated.length) return 0.5;
  const wins = rated.filter((e) => e.result === "victory").length;
  return wins / rated.length;
}

// Per-battle pressure (0..100) and factor breakdown.
export function computePressure(entry, log, idx) {
  if (!entry || entry.manual) return null;
  const streak = streakInto(log, idx);
  const streakPressure = streak <= -3 ? 100
    : streak <= 0 ? 40 + Math.abs(streak) * 18
    : streak >= 5 ? 5
    : Math.max(10, 40 - streak * 7);

  const team = [entry.playerElo, ...(entry.teammateElos || [])].filter((n) => n > 0);
  const enemy = (entry.enemyElos || []).filter((n) => n > 0);
  let diffPressure = 40;
  if (team.length && enemy.length) {
    const teamAvg = team.reduce((a, b) => a + b, 0) / team.length;
    const enemyAvg = enemy.reduce((a, b) => a + b, 0) / enemy.length;
    const gap = enemyAvg - teamAvg; // positive = underdog
    diffPressure = clamp(50 + gap / 12);
  }

  const borderPressure = borderProximity(entry.eloAfter ?? entry.playerElo);
  const form = last10WinRate(log, idx);
  const formPressure = clamp((0.55 - form) * 220 + 40);

  const score = Math.round(
    W_STREAK * streakPressure + W_DIFF * diffPressure +
    W_BORDER * borderPressure + W_FORM * formPressure
  );
  return {
    score: clamp(score),
    streak, streakPressure: clamp(streakPressure),
    diffPressure: clamp(diffPressure),
    borderPressure: clamp(borderPressure),
    formPressure: clamp(formPressure),
  };
}

// Aggregate: last N rated battles → clutch index 0..100
export function computeClutchIndex(log, limit = 30) {
  if (!log?.length) return { index: 0, verdict: "No Data", sample: 0, highPressure: 0, wins: 0, avgPressure: 0 };
  const rated = [];
  for (let i = 0; i < log.length && rated.length < limit; i++) {
    if (!log[i].manual && (log[i].result === "victory" || log[i].result === "defeat")) {
      const p = computePressure(log[i], log, i);
      if (p) rated.push({ e: log[i], p });
    }
  }
  const high = rated.filter((r) => r.p.score >= 60);
  const wins = high.filter((r) => r.e.result === "victory").length;
  const avgP = high.length ? high.reduce((a, r) => a + r.p.score, 0) / high.length : 0;
  const winRate = high.length ? wins / high.length : 0;
  const index = Math.round(winRate * avgP);
  const verdict =
    high.length < 3 ? "Warming Up" :
    index >= 70 ? "Legendary Under Fire" :
    index >= 50 ? "Clutch" :
    index >= 30 ? "Steady" :
    "Ice Cold";
  return { index, verdict, sample: rated.length, highPressure: high.length, wins, avgPressure: Math.round(avgP) };
}

// Per-battle badge kind for BattleLogCard chips.
export function clutchBadgeKind(pressure, result) {
  if (!pressure) return null;
  if (result === "victory" && pressure.score >= 60) return "fire";
  if (result === "defeat" && pressure.score >= 60) return "shatter";
  if (result === "victory" && pressure.score < 30) return "ice";
  return null;
}

// Radar-ready factor breakdown (0..1 each) for the current live state.
// Uses the most-recent battle context as the live snapshot.
export function liveRadarFactors(log, currentElo) {
  if (!log?.length) {
    return { streak: 0.2, opponents: 0.4, border: borderProximity(currentElo) / 100, form: 0.4 };
  }
  const p = computePressure(log[0], log, 0) || { streakPressure: 40, diffPressure: 40, formPressure: 40 };
  return {
    streak: p.streakPressure / 100,
    opponents: p.diffPressure / 100,
    border: borderProximity(currentElo) / 100,
    form: p.formPressure / 100,
  };
}

export { RANKS };
