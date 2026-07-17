// Battle-log rule preferences. Backed by localStorage, live-synced across
// components via a "bt.rulesChanged" event. Every rule can be toggled off.
import { useEffect, useState } from "react";

const KEY = "bt.battleLogRules";
const EVENT = "bt.rulesChanged";

const DEFAULTS = {
  antiFarm: true,        // cap gains on repeat enemy trios in short window
  durationSanity: false, // scale gains on very short/long matches
  rankGapFloor: true,    // soften smurf-lobby swings
  manualValidation: true,// prompt on extreme manual deltas
  duplicateGuard: true,  // prompt on likely duplicate entries
};

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch { return { ...DEFAULTS }; }
}

export function getRules() { return read(); }
export function isRuleOn(name) { return !!read()[name]; }
export function setRule(name, value) {
  const cur = read();
  cur[name] = !!value;
  try {
    localStorage.setItem(KEY, JSON.stringify(cur));
    window.dispatchEvent(new Event(EVENT));
  } catch {}
}

export function useBattleLogRules() {
  const [rules, setRules] = useState(read);
  useEffect(() => {
    const sync = () => setRules(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return rules;
}

// ── Rule helpers ────────────────────────────────────────────

// Anti-farm: check whether the same enemy trio (by rounded Elo signature)
// has appeared 3+ times within the last 20 minutes.
export function isFarmedTrio(battleLog, enemyElos) {
  if (!enemyElos?.length) return false;
  const sig = enemyElos.slice().map((e) => Math.round(Number(e) / 25) * 25).sort((a, b) => a - b).join("|");
  const cutoff = Date.now() - 20 * 60 * 1000;
  let count = 0;
  for (const e of battleLog || []) {
    if (e.manual) continue;
    const ts = new Date(e.timestamp).getTime();
    if (!(ts >= cutoff)) continue;
    const s = (e.enemyElos || []).map((x) => Math.round(Number(x) / 25) * 25).sort((a, b) => a - b).join("|");
    if (s === sig) count++;
    if (count >= 2) return true; // 2 prior + this one = 3rd+
  }
  return false;
}

// Duplicate: identical brawler + result within 30s of the previous entry.
export function isLikelyDuplicate(battleLog, { brawler, result }) {
  const prev = (battleLog || []).find((e) => !e.manual);
  if (!prev) return false;
  const prevTs = new Date(prev.timestamp).getTime();
  if (Date.now() - prevTs > 30 * 1000) return false;
  return prev.brawler === brawler && prev.result === result;
}
