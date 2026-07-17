// Season Vault — archives completed seasons for time-travel comparison.
import { getRank, TIER_COLORS } from "@/lib/ranks";

const VAULT_KEY = "bt.seasonVault";

export function loadVault() {
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function persist(vault) {
  try { localStorage.setItem(VAULT_KEY, JSON.stringify(vault.slice(0, 40))); } catch {}
}

// Capture a snapshot from current player + battle log. Called at season reset.
export function saveSeasonSnapshot(player, battleLog) {
  const seasonStart = player.seasonStartDate ? new Date(player.seasonStartDate).getTime() : 0;
  const entries = (battleLog || []).filter((e) => !e.manual && new Date(e.timestamp).getTime() >= seasonStart);
  const wins = entries.filter((e) => e.result === "victory").length;
  const losses = entries.filter((e) => e.result === "defeat").length;
  const games = wins + losses;
  const peak = player.currentSeasonHighest || player.highestElo || player.currentElo || 0;
  const peakRank = getRank(peak);
  const mvpMap = new Map();
  for (const e of entries) {
    const b = e.brawler || e.brawlers?.self;
    if (!b) continue;
    const row = mvpMap.get(b) || { name: b, w: 0, g: 0 };
    row.g++;
    if (e.result === "victory") row.w++;
    mvpMap.set(b, row);
  }
  const mvp = Array.from(mvpMap.values())
    .filter((r) => r.g >= 3)
    .sort((a, b) => (b.w / b.g) - (a.w / a.g))[0] || null;

  // Best win streak
  let best = 0, cur = 0;
  for (const e of [...entries].reverse()) {
    if (e.result === "victory") { cur++; best = Math.max(best, cur); }
    else cur = 0;
  }

  const snap = {
    id: `s-${Date.now()}`,
    endedAt: new Date().toISOString(),
    startedAt: player.seasonStartDate || null,
    startElo: entries.length ? entries[entries.length - 1].playerElo : (player.currentElo || 0),
    endElo: player.currentElo || 0,
    peakElo: peak,
    peakTier: peakRank.tier,
    peakRankName: peakRank.name,
    games,
    wins,
    losses,
    winRate: games ? Math.round((wins / games) * 100) : 0,
    bestStreak: best,
    mvpBrawler: mvp ? { name: mvp.name, wr: Math.round((mvp.w / mvp.g) * 100), games: mvp.g } : null,
    avgPerGame: games ? Math.round((peak - (entries[entries.length - 1]?.playerElo || 0)) / games) : 0,
  };
  const vault = [snap, ...loadVault()];
  persist(vault);
  return snap;
}

export function deleteSnapshot(id) {
  const next = loadVault().filter((s) => s.id !== id);
  persist(next);
  return next;
}

export function compareSnapshots(a, b) {
  if (!a || !b) return null;
  const diff = (k) => (a[k] || 0) - (b[k] || 0);
  return {
    peakElo: diff("peakElo"),
    winRate: diff("winRate"),
    games: diff("games"),
    bestStreak: diff("bestStreak"),
    avgPerGame: diff("avgPerGame"),
  };
}

export function tierColorFor(snap) {
  return TIER_COLORS[snap.peakTier] || TIER_COLORS.Bronze;
}
