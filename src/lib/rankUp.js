// Rank-up engine — checklist, promotion readiness score, simulator, tilt lock.
// All deterministic and side-effect free (except the tiny localStorage helpers
// at the bottom, which power the anti-tilt lock user setting).
import { getRank, getRankIndex, RANKS } from "@/lib/ranks";
import { predictBattles } from "@/lib/battlePredictor";
import { getWinStreak, getLossStreak, getBestWinStreak } from "@/lib/battleLog";

// ---------- helpers ----------

function safeLog(battleLog) {
  return (battleLog || []).filter((e) => !e.manual);
}

function recentWinRate(log, n = 10) {
  const recent = safeLog(log).slice(0, n);
  if (!recent.length) return null;
  const wins = recent.filter((e) => e.result === "victory").length;
  return Math.round((wins / recent.length) * 100);
}

function brawlerPoolSize(log) {
  const set = new Set();
  for (const e of safeLog(log).slice(0, 40)) {
    const b = e.brawler || e.brawlers?.self;
    if (b) set.add(b);
  }
  return set.size;
}

function safestModeStats(log) {
  const modes = {};
  for (const e of safeLog(log).slice(0, 40)) {
    if (!e.mode) continue;
    modes[e.mode] = modes[e.mode] || { w: 0, t: 0 };
    modes[e.mode].t += 1;
    if (e.result === "victory") modes[e.mode].w += 1;
  }
  let best = null;
  for (const [mode, s] of Object.entries(modes)) {
    if (s.t < 3) continue;
    const wr = (s.w / s.t) * 100;
    if (!best || wr > best.wr) best = { mode, wr: Math.round(wr), games: s.t };
  }
  return best;
}

function throwsCount(log, n = 10) {
  // A "throw" heuristic: recent defeat with negative delta larger than 25.
  const recent = safeLog(log).slice(0, n);
  return recent.filter((e) => e.result === "defeat" && (e.delta ?? 0) <= -25).length;
}

// ---------- checklist ----------

// Returns an ordered list of concrete tasks with `done` flags so the UI can
// show a checklist toward the next sub-rank.
export function buildRankUpChecklist(player, battleLog) {
  const streak = getWinStreak(battleLog);
  const lossStreak = getLossStreak(battleLog);
  const wr = recentWinRate(battleLog, 10);
  const pool = brawlerPoolSize(battleLog);
  const safest = safestModeStats(battleLog);
  const bad = throwsCount(battleLog, 10);

  const nextRank = RANKS[Math.min(RANKS.length - 1, getRankIndex(player.currentElo) + 1)];
  const eloToNext = Math.max(0, (getRank(player.currentElo).max + 1) - player.currentElo);

  return [
    {
      id: "streak",
      label: "Build a 3-win streak",
      hint: `Current: ${streak >= 0 ? streak : 0} wins`,
      done: streak >= 3,
    },
    {
      id: "fewer_throws",
      label: "Keep last 10 games with fewer than 3 heavy losses",
      hint: `Heavy losses: ${bad}/10`,
      done: bad < 3,
    },
    {
      id: "pool",
      label: "Have a brawler pool of at least 4 played recently",
      hint: `Recent pool: ${pool}`,
      done: pool >= 4,
    },
    {
      id: "safe_mode",
      label: "Queue your strongest mode (60%+ WR, 3+ games)",
      hint: safest ? `${safest.mode} · ${safest.wr}% over ${safest.games}` : "Not enough mode data",
      done: !!safest && safest.wr >= 60,
    },
    {
      id: "wr",
      label: "Maintain 55%+ win rate over last 10 games",
      hint: wr == null ? "Play a few games" : `Recent WR: ${wr}%`,
      done: (wr ?? 0) >= 55,
    },
    {
      id: "tilt",
      label: "Not on a loss streak of 3+",
      hint: `Current loss streak: ${lossStreak}`,
      done: lossStreak < 3,
    },
    {
      id: "elo",
      label: `Push ${eloToNext} more Elo to reach ${nextRank.name}`,
      hint: `${player.currentElo.toLocaleString()} → ${nextRank.min.toLocaleString()}`,
      done: eloToNext === 0,
    },
  ];
}

// ---------- promotion readiness score ----------

// Combines win rate, recent trend, tilt risk, matchup quality (proxied by
// avg enemy Elo differential in recent games). Returns 0..100.
export function promotionReadiness(player, battleLog) {
  const log = safeLog(battleLog);
  const overallWR = Number(player.winRate) || 50;
  const recentWR = recentWinRate(battleLog, 10) ?? overallWR;
  const trend = recentWR - overallWR; // +ve is climbing

  const lossStreak = getLossStreak(battleLog);
  const tiltPenalty = Math.min(30, lossStreak * 10);

  const streak = getWinStreak(battleLog);
  const streakBonus = Math.max(0, Math.min(15, streak * 3));

  // Matchup quality: avg (player_elo - enemy_avg) over recent games, capped.
  let matchup = 0;
  const recent = log.slice(0, 10);
  let n = 0;
  for (const e of recent) {
    const enemies = (e.enemyElos || []).filter(Boolean);
    if (!enemies.length) continue;
    const avg = enemies.reduce((a, b) => a + Number(b), 0) / enemies.length;
    matchup += (player.currentElo - avg);
    n++;
  }
  if (n) matchup = matchup / n;
  const matchupScore = Math.max(-10, Math.min(10, matchup / 25));

  const raw = 50 + (recentWR - 50) * 0.6 + trend * 0.5 + streakBonus - tiltPenalty + matchupScore;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  let label = "Not ready — stabilise first";
  let tone = "rose";
  if (score >= 75) { label = "Ready to push"; tone = "emerald"; }
  else if (score >= 55) { label = "Warming up"; tone = "cyan"; }
  else if (score >= 40) { label = "Uneven — pick your spots"; tone = "amber"; }

  return {
    score,
    label,
    tone,
    factors: {
      recentWR,
      overallWR,
      trend: Math.round(trend),
      streak,
      lossStreak,
      matchup: Math.round(matchup),
    },
  };
}

// ---------- rank-up simulator ----------

// Simulate "if I win X of the next Y matches" using the deterministic Elo
// engine via predictBattles at extremes and interpolating win share.
export function simulateWinShare(player, wins, total, battleLog) {
  const w = Math.max(0, Math.min(total, wins));
  const losses = total - w;
  const teammateElos = (player.teamElos || []).map(Number).filter(Boolean);
  const highestElo = Math.max(player.highestElo || 0, player.currentElo);

  // Use predictBattles' extremes to grab per-battle deltas, then compose.
  const preview = predictBattles(
    player.currentElo,
    player.winRate || 50,
    "solo",
    teammateElos,
    [],
    highestElo,
  );
  const avgWinDelta = preview.bestCase.path[0]?.delta ?? 30;
  const avgLossDelta = preview.worstCase.path[0]?.delta ?? -30;

  const projectedElo = Math.max(
    3000 <= player.currentElo ? 3000 : 0, // Diamond+ floor
    Math.round(player.currentElo + w * avgWinDelta + losses * avgLossDelta),
  );
  const projectedRank = getRank(projectedElo);
  const startIdx = getRankIndex(player.currentElo);
  const endIdx = getRankIndex(projectedElo);
  const rankChange = endIdx - startIdx;

  return {
    wins: w,
    losses,
    total,
    winDelta: avgWinDelta,
    lossDelta: avgLossDelta,
    projectedElo,
    projectedRank,
    rankChange,
    eloChange: projectedElo - player.currentElo,
  };
}

// ---------- anti-tilt lock (user setting + guard) ----------

const TILT_LOCK_KEY = "anti_tilt_lock_enabled";
const TILT_LOCK_THRESHOLD_KEY = "anti_tilt_lock_threshold";

export function isTiltLockEnabled() {
  try { return localStorage.getItem(TILT_LOCK_KEY) === "true"; } catch { return false; }
}

export function setTiltLockEnabled(enabled) {
  try { localStorage.setItem(TILT_LOCK_KEY, enabled ? "true" : "false"); } catch {}
}

export function getTiltLockThreshold() {
  try {
    const raw = Number(localStorage.getItem(TILT_LOCK_THRESHOLD_KEY));
    return raw >= 2 && raw <= 8 ? raw : 3;
  } catch { return 3; }
}

export function setTiltLockThreshold(n) {
  try { localStorage.setItem(TILT_LOCK_THRESHOLD_KEY, String(n)); } catch {}
}

// Returns { locked: bool, lossStreak, threshold } when the player should be
// warned before logging another battle.
export function checkTiltLock(battleLog) {
  const enabled = isTiltLockEnabled();
  const threshold = getTiltLockThreshold();
  const lossStreak = getLossStreak(battleLog);
  return { locked: enabled && lossStreak >= threshold, lossStreak, threshold, enabled };
}

// Small utility so the "best streak" pill can be shown next to readiness.
export function personalBestStreak(log) {
  return getBestWinStreak(log);
}
