// Live Tilt Detector — surfaces a break-suggestion banner when the player
// is losing hot and their Elo is bleeding. Reads pressure from clutchIndex.
import { computePressure } from "@/lib/clutchIndex";

const DISMISS_KEY = "bt.tiltDismissedUntil";

export function isTiltDismissed() {
  try {
    const v = Number(localStorage.getItem(DISMISS_KEY));
    return Number.isFinite(v) && v > Date.now();
  } catch { return false; }
}

export function dismissTilt(minutes = 15) {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now() + minutes * 60000)); } catch {}
}

export function detectTilt(battleLog) {
  if (isTiltDismissed()) return { tilted: false, dismissed: true };
  const rated = (battleLog || []).filter((e) => !e.manual && (e.result === "victory" || e.result === "defeat"));
  if (rated.length < 3) return { tilted: false };
  const last5 = rated.slice(0, 5);

  // Loss streak
  let streak = 0;
  for (const e of rated) {
    if (e.result === "defeat") streak++;
    else break;
  }
  if (streak < 3) return { tilted: false, streak };

  // Elo drop over last 90 minutes
  const cutoff = Date.now() - 90 * 60 * 1000;
  const inWindow = rated.filter((e) => new Date(e.timestamp).getTime() >= cutoff);
  if (inWindow.length === 0) return { tilted: false };
  const dropped = (inWindow[inWindow.length - 1].playerElo || 0) - (inWindow[0].eloAfter || 0);
  if (dropped < 60) return { tilted: false, streak, dropped };

  // Avg pressure across last 5
  const pressures = last5
    .map((e, idx) => computePressure(e, rated, idx))
    .filter(Boolean)
    .map((p) => p.score);
  const avgP = pressures.length ? pressures.reduce((a, b) => a + b, 0) / pressures.length : 0;
  if (avgP < 55) return { tilted: false, streak, dropped, avgP };

  return { tilted: true, streak, dropped: Math.round(dropped), avgP: Math.round(avgP) };
}
