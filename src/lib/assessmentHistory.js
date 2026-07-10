// Deserved Rank assessment history — localStorage with dual-key backup.
// Each entry snapshots inputs + result so history stays stable even if the
// engine constants change later.

const KEY = "deserved_rank_history_v1";
const BACKUP_KEY = "deserved_rank_history_v1.backup";
const MAX_ENTRIES = 50;

function readKey(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function loadHistory() {
  const primary = readKey(KEY);
  if (primary && primary.length) return primary;
  const backup = readKey(BACKUP_KEY);
  if (backup && backup.length) {
    // Restore primary from backup
    try { localStorage.setItem(KEY, JSON.stringify(backup)); } catch {}
    return backup;
  }
  return [];
}

function writeAll(list) {
  const payload = JSON.stringify(list);
  try { localStorage.setItem(KEY, payload); } catch {}
  try { localStorage.setItem(BACKUP_KEY, payload); } catch {}
}

export function saveAssessment(result, responses) {
  if (!result) return null;
  const entry = {
    id: `dr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    currentElo: result.currentElo,
    currentRankName: result.currentRank?.name,
    currentRankTier: result.currentRank?.tier,
    currentRankMin: result.currentRank?.min,
    deservedElo: result.deservedElo,
    deservedRankName: result.deservedRank?.name,
    deservedRankTier: result.deservedRank?.tier,
    deservedRankMin: result.deservedRank?.min,
    deltaElo: result.deltaElo,
    deltaIdx: result.deltaIdx,
    confidence: result.confidence,
    sampleSize: result.sampleSize,
    baseElo: result.baseElo,
    totalAdjust: result.totalAdjust,
    categories: result.categories,
    adjustments: result.adjustments,
    verdict: result.verdict,
    verdictClass: result.verdictClass,
    focusNotes: result.focusNotes,
    gapExplanation: result.gapExplanation,
    responses,
  };
  const list = [entry, ...loadHistory()].slice(0, MAX_ENTRIES);
  writeAll(list);
  return entry;
}

export function deleteAssessment(id) {
  const next = loadHistory().filter((e) => e.id !== id);
  writeAll(next);
  return next;
}

export function clearHistory() {
  writeAll([]);
}

// Merge imported entries with existing history, dedupe by id, newest-first.
export function importHistory(entries) {
  if (!Array.isArray(entries)) return loadHistory();
  const current = loadHistory();
  const map = new Map();
  for (const e of [...entries, ...current]) {
    if (e && e.id) map.set(e.id, e);
  }
  const merged = [...map.values()]
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 50);
  writeAll(merged);
  return merged;
}

// Rehydrate a stored entry into the shape DeservedRankReveal expects.
export function entryToResult(entry) {
  if (!entry) return null;
  return {
    deservedElo: entry.deservedElo,
    currentElo: entry.currentElo,
    currentRank: {
      name: entry.currentRankName,
      tier: entry.currentRankTier,
      min: entry.currentRankMin,
    },
    deservedRank: {
      name: entry.deservedRankName,
      tier: entry.deservedRankTier,
      min: entry.deservedRankMin,
    },
    deltaIdx: entry.deltaIdx,
    deltaElo: entry.deltaElo,
    verdict: entry.verdict,
    verdictClass: entry.verdictClass,
    baseElo: entry.baseElo,
    totalAdjust: entry.totalAdjust,
    categories: entry.categories,
    adjustments: entry.adjustments,
    confidence: entry.confidence,
    sampleSize: entry.sampleSize,
    savedAt: entry.timestamp,
  };
}
