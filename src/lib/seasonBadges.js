// Season achievement badges — awarded based on aggregated season stats.
// Pure functions; consumed by SeasonEndReport and share cards.
export const BADGE_DEFS = [
  { id: "first_climb",   label: "First Climb",       emoji: "🧗", desc: "Finished a full season", test: (s) => s.games >= 1 },
  { id: "grinder",       label: "Grinder",           emoji: "⛏️", desc: "50+ ranked games",         test: (s) => s.games >= 50 },
  { id: "iron_grind",    label: "Iron Grind",        emoji: "🛠️", desc: "150+ ranked games",        test: (s) => s.games >= 150 },
  { id: "hot_hand",      label: "Hot Hand",          emoji: "🔥", desc: "5+ win streak",            test: (s) => s.bestStreak >= 5 },
  { id: "unstoppable",   label: "Unstoppable",       emoji: "⚡", desc: "8+ win streak",            test: (s) => s.bestStreak >= 8 },
  { id: "sharp_shooter", label: "Sharp Shooter",     emoji: "🎯", desc: "60%+ season win rate",     test: (s) => s.winRate >= 60 && s.games >= 20 },
  { id: "one_trick",     label: "One-Trick Prodigy", emoji: "🎪", desc: "Same brawler used 40%+ of games", test: (s) => s.topBrawlerShare >= 0.4 && s.games >= 20 },
  { id: "polyglot",      label: "Polyglot",          emoji: "🎨", desc: "10+ unique brawlers played", test: (s) => s.uniqueBrawlers >= 10 },
  { id: "diamond_dweller", label: "Diamond Dweller", emoji: "💎", desc: "Peaked Diamond or higher",  test: (s) => s.peakElo >= 3000 },
  { id: "mythic_touch",  label: "Mythic Touch",      emoji: "🟣", desc: "Peaked Mythic or higher",   test: (s) => s.peakElo >= 4500 },
  { id: "legend",        label: "Legend",            emoji: "🟥", desc: "Peaked Legendary or higher", test: (s) => s.peakElo >= 6000 },
  { id: "master",        label: "Master",            emoji: "🏆", desc: "Peaked Masters or higher",  test: (s) => s.peakElo >= 8250 },
  { id: "pro",           label: "Pro",               emoji: "👑", desc: "Reached Pro rank",          test: (s) => s.peakElo >= 11250 },
  { id: "comeback",      label: "Comeback Kid",      emoji: "🔄", desc: "Climbed +500 Elo after a drop", test: (s) => s.biggestClimb >= 500 },
  { id: "tilt_proof",    label: "Tilt-Proof",        emoji: "🧊", desc: "No 4+ loss streak all season",  test: (s) => s.worstLossStreak < 4 && s.games >= 20 },
];

function computeSeasonStats(player, log) {
  const real = (log || []).filter((e) => !e.manual);
  const games = real.length;
  const wins = real.filter((e) => e.result === "victory").length;
  const winRate = games ? Math.round((wins / games) * 100) : 0;
  const peakElo = Math.max(player?.currentSeasonHighest || 0, player?.currentElo || 0);

  // Brawler share
  const counts = {};
  for (const e of real) {
    const b = e.brawler || e.brawlers?.self;
    if (b) counts[b] = (counts[b] || 0) + 1;
  }
  const uniqueBrawlers = Object.keys(counts).length;
  const topCount = Math.max(0, ...Object.values(counts));
  const topBrawlerShare = games ? topCount / games : 0;

  // Streaks (traverse in chronological order)
  const chrono = [...real].reverse();
  let bestStreak = 0, curW = 0, worstLossStreak = 0, curL = 0;
  for (const e of chrono) {
    if (e.result === "victory") { curW++; curL = 0; bestStreak = Math.max(bestStreak, curW); }
    else if (e.result === "defeat") { curL++; curW = 0; worstLossStreak = Math.max(worstLossStreak, curL); }
    else { curW = 0; curL = 0; }
  }

  // Biggest climb = max(runningPeak - trough after previous trough).
  let biggestClimb = 0;
  let trough = Infinity;
  for (const e of chrono) {
    const elo = e.eloAfter ?? e.elo ?? 0;
    trough = Math.min(trough, elo);
    biggestClimb = Math.max(biggestClimb, elo - trough);
  }

  return { games, wins, winRate, peakElo, uniqueBrawlers, topBrawlerShare, bestStreak, worstLossStreak, biggestClimb };
}

export function computeSeasonBadges(player, log) {
  const s = computeSeasonStats(player, log);
  return BADGE_DEFS.filter((b) => {
    try { return b.test(s); } catch { return false; }
  });
}

// ---------- prior-season snapshot for comparison ----------

const PRIOR_KEY = "prior_season_snapshot";

export function loadPriorSeason() {
  try { return JSON.parse(localStorage.getItem(PRIOR_KEY) || "null"); } catch { return null; }
}

export function savePriorSeason(player, log) {
  const s = computeSeasonStats(player, log);
  try { localStorage.setItem(PRIOR_KEY, JSON.stringify({ ...s, savedAt: Date.now() })); } catch {}
  return s;
}

export function computeSeasonDiff(player, log) {
  const current = computeSeasonStats(player, log);
  const prior = loadPriorSeason();
  if (!prior) return { current, prior: null, diff: null };
  const diff = {
    peakElo: current.peakElo - prior.peakElo,
    winRate: current.winRate - prior.winRate,
    games: current.games - prior.games,
    bestStreak: current.bestStreak - prior.bestStreak,
  };
  return { current, prior, diff };
}
