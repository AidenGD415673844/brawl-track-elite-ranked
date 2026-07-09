// LocalStorage-backed snapshot history + milestone derivation.
import { RANKS, getRank, KEY_THRESHOLDS } from "@/lib/ranks";
import { getBestWinStreak } from "@/lib/battleLog";

const KEY = "ranked_tracker_snapshots_v1";

export function loadSnapshots() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSnapshot(data) {
  const snaps = loadSnapshots();
  const entry = { ...data, date: new Date().toISOString() };
  snaps.push(entry);
  const trimmed = snaps.slice(-100);
  localStorage.setItem(KEY, JSON.stringify(trimmed));
  return trimmed;
}

export function clearSnapshots() {
  localStorage.removeItem(KEY);
  return [];
}

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

// Derive milestones from snapshot history AND battle log.
export function computeMilestones(snaps, battleLog = []) {
  const milestones = [];

  // ─── Snapshot-based milestones ──────────────────────────────
  if (snaps.length) {
    const sorted = [...snaps].sort((a, b) => new Date(a.date) - new Date(b.date));

    // First time reaching each rank tier
    const seenTiers = new Set();
    for (const s of sorted) {
      const rank = getRank(s.currentElo);
      if (!seenTiers.has(rank.tier)) {
        seenTiers.add(rank.tier);
        milestones.push({
          id: `tier-${rank.tier}`,
          type: "rank",
          title: `Reached ${rank.tier}`,
          detail: `${rank.name} · ${s.currentElo} Elo`,
          date: fmtDate(s.date),
        });
      }
    }

    // Key Elo thresholds
    const crossed = new Set();
    for (const s of sorted) {
      for (const t of KEY_THRESHOLDS) {
        if (s.currentElo >= t && !crossed.has(t)) {
          crossed.add(t);
          milestones.push({
            id: `thr-${t}`,
            type: "threshold",
            title: `Crossed ${t.toLocaleString()} Elo`,
            detail: getRank(t).name,
            date: fmtDate(s.date),
          });
        }
      }
    }

    // Highest Elo reached (All-Time Peak)
    const peak = sorted.reduce((a, b) => (b.currentElo > a.currentElo ? b : a));
    milestones.push({
      id: "peak",
      type: "peak",
      title: "All-Time Peak",
      detail: `${peak.currentElo} Elo · ${getRank(peak.currentElo).name}`,
      date: fmtDate(peak.date),
    });

    // Highest win rate reached
    const bestWr = sorted.reduce((a, b) => ((b.winRate || 0) > (a.winRate || 0) ? b : a));
    milestones.push({
      id: "winrate",
      type: "winrate",
      title: "Highest Win Rate",
      detail: `${bestWr.winRate || 0}%`,
      date: fmtDate(bestWr.date),
    });

    // Longest win streak (from recorded streak field)
    const bestStreak = sorted.reduce(
      (a, b) => ((b.winStreak || 0) > (a.winStreak || 0) ? b : a),
      sorted[0]
    );
    if ((bestStreak.winStreak || 0) > 0) {
      milestones.push({
        id: "streak",
        type: "streak",
        title: "Longest Win Streak",
        detail: `${bestStreak.winStreak} wins in a row`,
        date: fmtDate(bestStreak.date),
      });
    }
  }

  // ─── Battle-log-based milestones ────────────────────────────
  if (battleLog.length > 0) {
    // Best win streak from battle log
    const logBestStreak = getBestWinStreak(battleLog);
    if (logBestStreak >= 3) {
      milestones.push({
        id: "log-streak",
        type: "streak",
        title: "Battle Log Streak",
        detail: `${logBestStreak} wins in a row`,
        date: "",
      });
    }

    // Peak elo from battle log
    const logPeak = battleLog.reduce((max, e) => Math.max(max, e.eloAfter), 0);
    if (logPeak > 0) {
      milestones.push({
        id: "log-peak",
        type: "peak",
        title: "Battle Log Peak",
        detail: `${logPeak.toLocaleString()} Elo · ${getRank(logPeak).name}`,
        date: "",
      });
    }

    // Games logged milestone
    if (battleLog.length >= 10) {
      milestones.push({
        id: "log-games",
        type: "games",
        title: `${battleLog.length} Battles Logged`,
        detail: "Dedicated tracker",
        date: "",
      });
    }
  }

  return milestones;
}