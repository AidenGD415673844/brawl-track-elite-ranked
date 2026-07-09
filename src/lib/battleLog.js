// Battle log storage + Elo calculation (delegates to eloEngine).
import { calculateElo, checkRankUp } from "@/lib/eloEngine";
import { z } from "zod";

const BATTLE_LOG_KEY = "ranked_battle_log_v2";

// Schema for entries received from remote P2P peers. Fields are constrained
// to prevent prototype-pollution keys, oversized strings, and out-of-range
// numbers from corrupting local state.
const safeString = (max) =>
  z.string().max(max).regex(/^[^\u0000-\u001F]*$/);

const RemoteBattleSchema = z
  .object({
    id: safeString(128),
    mode: safeString(40).optional(),
    result: z.enum(["victory", "defeat", "draw"]).optional(),
    brawlers: z.record(safeString(40), safeString(40)).optional(),
    starPlayer: safeString(20).optional().nullable(),
    duration: z.number().int().min(0).max(3600).optional().nullable(),
    teammateElos: z.array(z.number().finite().min(0).max(100000)).max(4).optional(),
    enemyElos: z.array(z.number().finite().min(0).max(100000)).max(4).optional(),
    teammateProfiles: z
      .array(
        z
          .object({
            highestElo: z.number().finite().min(0).max(100000).optional(),
            lastSeasonElo: z.number().finite().min(0).max(100000).optional(),
            trophies: z.number().finite().min(0).max(1000000).optional(),
            skill: z.number().finite().min(0).max(100).optional(),
          })
          .strict(),
      )
      .max(4)
      .optional(),
    queueType: safeString(20).optional(),
    performance: z.record(safeString(20), z.number().finite().min(-10000).max(10000)).nullable().optional(),
    seasonRefreshed: z.boolean().optional(),
    elo: z.number().finite().min(0).max(100000).optional(),
    eloAfter: z.number().finite().min(0).max(100000).optional(),
    delta: z.number().finite().min(-500).max(500).optional(),
    timestamp: z.number().finite().optional(),
    manual: z.boolean().optional(),
  })
  .strict();

// Cap raw payload size to prevent storage exhaustion from malicious peers.
const MAX_REMOTE_ENTRY_BYTES = 8192;

export function validateRemoteEntry(entry) {
  if (!entry || typeof entry !== "object") return null;
  try {
    const serialized = JSON.stringify(entry);
    if (serialized.length > MAX_REMOTE_ENTRY_BYTES) return null;
  } catch {
    return null;
  }
  const result = RemoteBattleSchema.safeParse(entry);
  return result.success ? result.data : null;
}


export const MODES = [
  "Heist", "Hot Zone", "Brawl Ball", "Gem Grab",
  "Bounty", "Knockout",
];

export function loadBattleLog() {
  try {
    const raw = localStorage.getItem(BATTLE_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBattleLog(log) {
  try {
    localStorage.setItem(BATTLE_LOG_KEY, JSON.stringify(log));
  } catch (err) {
    // Storage quota or serialization failure — trim to the most recent 500
    // entries and retry so newly-logged battles never silently disappear.
    try {
      const trimmed = (log || []).slice(0, 500);
      localStorage.setItem(BATTLE_LOG_KEY, JSON.stringify(trimmed));
      console.warn("Battle log trimmed to 500 entries due to storage limits.");
    } catch (retryErr) {
      console.error("Failed to persist battle log:", retryErr);
    }
  }
}

// Preview-only delta for the input form.
export function calculateDelta(playerElo, teammateElos, enemyElos, result, seasonRefreshed = false, queueType = "solo", highestElo = playerElo, starPlayer = null, teammateProfiles = null) {
  const { delta } = calculateElo(playerElo, {
    result, teammateElos, enemyElos, seasonRefreshed, queueType, highestElo,
    starPlayer: starPlayer === "self" || starPlayer === true,
    teammateProfiles,
  });
  return delta;
}

// Compute Elo transitions (before → after) for all participants in a battle.
export function computeParticipantTransitions(entry) {
  const {
    playerElo, teammateElos = [], enemyElos = [],
    result, seasonRefreshed, queueType, starPlayer,
    eloAfter,
  } = entry;

  const self = { before: playerElo, after: eloAfter };
  const enemyResult = result === "victory" ? "defeat" : result === "defeat" ? "victory" : "draw";

  const mates = teammateElos.map((elo, i) => {
    const otherMates = [playerElo, ...teammateElos.filter((_, j) => j !== i)];
    const calc = calculateElo(elo, {
      result,
      teammateElos: otherMates,
      enemyElos,
      seasonRefreshed,
      queueType: entry.queueType || "team",
      starPlayer: starPlayer === `mate${i + 1}`,
    });
    return { before: elo, after: calc.eloAfter };
  });

  const enemies = enemyElos.map((elo, i) => {
    const otherEnemies = enemyElos.filter((_, j) => j !== i);
    const calc = calculateElo(elo, {
      result: enemyResult,
      teammateElos: otherEnemies,
      enemyElos: [playerElo, ...teammateElos],
      seasonRefreshed,
      queueType,
      starPlayer: starPlayer === `enemy${i + 1}`,
    });
    return { before: elo, after: calc.eloAfter };
  });

  return { self, mates, enemies };
}

export function addBattle(playerElo, {
  mode, result, teammateElos, enemyElos,
  brawler, brawlers, starPlayer, seasonRefreshed, manualDelta, queueType, highestElo, duration, performance,
  teammateProfiles,
}) {
  const isStarSelf = starPlayer === "self" || starPlayer === true;
  const calc = calculateElo(playerElo, {
    result, teammateElos, enemyElos, seasonRefreshed, manualDelta, queueType, highestElo,
    starPlayer: isStarSelf,
    teammateProfiles,
  });
  const rankUp = checkRankUp(playerElo, calc.eloAfter);
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    mode,
    result,
    brawler: brawler || brawlers?.self || null,
    brawlers: brawlers || { self: brawler || null },
    starPlayer: starPlayer || null,
    queueType: queueType || "solo",
    duration: duration ?? null,
    performance: performance || null,
    highestElo: highestElo || playerElo,
    teammateElos: teammateElos || [],
    teammateProfiles: teammateProfiles || [],
    enemyElos: enemyElos || [],
    playerElo,
    delta: calc.delta,
    eloAfter: calc.eloAfter,
    eloDetails: calc.details,
    rankUp,
    manual: false,
    timestamp: new Date().toISOString(),
  };
  const log = loadBattleLog();
  const newLog = [entry, ...log];
  saveBattleLog(newLog);
  return { entry, log: newLog };
}

export function addManualAdjustment(playerElo, adjustment) {
  const calc = calculateElo(playerElo, { result: "victory", manualDelta: adjustment });
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    mode: "Manual",
    result: "adjustment",
    brawler: null,
    brawlers: {},
    starPlayer: null,
    queueType: "solo",
    duration: null,
    highestElo: playerElo,
    teammateElos: [],
    enemyElos: [],
    playerElo,
    delta: calc.delta,
    eloAfter: calc.eloAfter,
    manual: true,
    timestamp: new Date().toISOString(),
  };
  const log = loadBattleLog();
  const newLog = [entry, ...log];
  saveBattleLog(newLog);
  return { entry, log: newLog };
}

export function editBattle(id, updatedData) {
  const log = loadBattleLog();
  const idx = log.findIndex((e) => e.id === id);
  if (idx === -1) return { log, newElo: null };

  const entry = log[idx];
  const isStarSelf = updatedData.starPlayer === "self" || updatedData.starPlayer === true;

  // Recalculate the edited entry
  const calc = calculateElo(entry.playerElo, {
    result: updatedData.result,
    teammateElos: updatedData.teammateElos,
    enemyElos: updatedData.enemyElos,
    seasonRefreshed: updatedData.seasonRefreshed,
    queueType: updatedData.queueType,
    highestElo: entry.highestElo || updatedData.highestElo,
    starPlayer: isStarSelf,
    teammateProfiles: updatedData.teammateProfiles,
  });
  const rankUp = checkRankUp(entry.playerElo, calc.eloAfter);

  log[idx] = {
    ...entry,
    ...updatedData,
    brawler: updatedData.brawlers?.self || updatedData.brawler || entry.brawler,
    delta: calc.delta,
    eloAfter: calc.eloAfter,
    eloDetails: calc.details,
    rankUp,
  };

  // Cascade Elo changes to all newer entries (lower indices = more recent)
  let currentElo = calc.eloAfter;
  for (let i = idx - 1; i >= 0; i--) {
    log[i].playerElo = currentElo;
    if (!log[i].manual) {
      const recalc = calculateElo(currentElo, {
        result: log[i].result,
        teammateElos: log[i].teammateElos,
        enemyElos: log[i].enemyElos,
        seasonRefreshed: log[i].seasonRefreshed,
        queueType: log[i].queueType,
        highestElo: log[i].highestElo,
        starPlayer: log[i].starPlayer === "self" || log[i].starPlayer === true,
        teammateProfiles: log[i].teammateProfiles,
      });
      log[i].delta = recalc.delta;
      log[i].eloAfter = recalc.eloAfter;
      log[i].eloDetails = recalc.details;
      log[i].rankUp = checkRankUp(currentElo, recalc.eloAfter);
    } else {
      log[i].eloAfter = Math.max(0, currentElo + log[i].delta);
    }
    currentElo = log[i].eloAfter;
  }

  saveBattleLog(log);
  return { log, newElo: currentElo };
}

export function deleteBattle(id) {
  const log = loadBattleLog();
  const deleted = log.find((e) => e.id === id);
  const filtered = log.filter((e) => e.id !== id);

  if (filtered.length === 0) {
    saveBattleLog(filtered);
    return { log: filtered, newElo: deleted?.playerElo ?? null, wasManual: deleted?.manual || false };
  }

  // Oldest first for recalculation
  const chrono = [...filtered].reverse();
  let currentElo = chrono[0].playerElo;
  for (const entry of chrono) {
    entry.playerElo = currentElo;
    entry.eloAfter = Math.max(0, currentElo + entry.delta);
    currentElo = entry.eloAfter;
  }
  chrono.reverse();
  saveBattleLog(chrono);
  return { log: chrono, newElo: currentElo, wasManual: deleted?.manual || false };
}

export function addRemoteBattle(entry) {
  const validated = validateRemoteEntry(entry);
  if (!validated) {
    // Reject untrusted/malformed peer payloads silently
    return loadBattleLog();
  }
  const log = loadBattleLog();
  if (log.some((e) => e.id === validated.id)) return log;
  const remoteEntry = { ...validated, remote: true };
  const newLog = [remoteEntry, ...log];
  saveBattleLog(newLog);
  return newLog;
}


export function clearBattleLog() {
  localStorage.removeItem(BATTLE_LOG_KEY);
  return [];
}

export function getWinStreak(log) {
  const real = (log || []).filter((e) => !e.manual);
  if (!real.length) return 0;
  let streak = 0;
  const dir = real[0].result === "victory" ? 1 : -1;
  for (const e of real) {
    if (e.result === "draw") break;
    if ((e.result === "victory" ? 1 : -1) === dir) streak++;
    else break;
  }
  return dir > 0 ? streak : -streak;
}

export function getBestWinStreak(log) {
  let best = 0;
  let current = 0;
  const sorted = [...(log || []).filter((e) => !e.manual)].reverse();
  for (const e of sorted) {
    if (e.result === "victory") {
      current++;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

export function getLossStreak(log) {
  const real = (log || []).filter((e) => !e.manual);
  if (!real.length) return 0;
  let streak = 0;
  if (real[0].result !== "defeat") return 0;
  for (const e of real) {
    if (e.result === "defeat") streak++;
    else break;
  }
  return streak;
}