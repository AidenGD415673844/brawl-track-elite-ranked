// Rank Territory & Threat Assessment engine.
import { getRank } from "@/lib/ranks";

function avgAbsDelta(log, kind, limit = 15) {
  const deltas = [];
  for (let i = 0; i < log.length && deltas.length < limit; i++) {
    const e = log[i];
    if (e.manual || !e.result || typeof e.delta !== "number") continue;
    if (kind === "win" && e.result === "victory" && e.delta > 0) deltas.push(e.delta);
    if (kind === "loss" && e.result === "defeat" && e.delta < 0) deltas.push(Math.abs(e.delta));
  }
  if (!deltas.length) return kind === "win" ? 22 : 25;
  return deltas.reduce((a, b) => a + b, 0) / deltas.length;
}

function trendSlope(log, limit = 10) {
  const points = [];
  for (let i = 0; i < log.length && points.length < limit; i++) {
    const e = log[i];
    if (e.manual || typeof e.eloAfter !== "number") continue;
    points.push(e.eloAfter);
  }
  if (points.length < 2) return 0;
  const ys = points.reverse(); // oldest → newest
  const n = ys.length;
  const xMean = (n - 1) / 2;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (ys[i] - yMean);
    den += (i - xMean) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

export function computeTerritory(currentElo, log) {
  const rank = getRank(currentElo);
  const bandMin = rank.min;
  const bandMax = isFinite(rank.max) ? rank.max : bandMin + 500;
  const span = bandMax - bandMin || 1;
  const position = Math.max(0, Math.min(1, (currentElo - bandMin) / span));

  const zone = position <= 0.25 ? "danger"
    : position >= 0.75 ? "promotion"
    : "safe";

  const slope = trendSlope(log);
  const trendVector = slope > 4 ? "advancing" : slope < -4 ? "retreating" : "holding";

  // Territory control %: position + trend nudge (±15)
  const trendBonus = Math.max(-15, Math.min(15, slope * 1.5));
  const control = Math.max(0, Math.min(100, Math.round(position * 100 + trendBonus)));

  const avgWin = avgAbsDelta(log, "win");
  const avgLoss = avgAbsDelta(log, "loss");
  const distFloor = currentElo - bandMin;
  const distCeil = bandMax - currentElo;
  const gamesToDemo = Math.max(1, Math.ceil(distFloor / Math.max(5, avgLoss)));
  const gamesToPromo = Math.max(1, Math.ceil(distCeil / Math.max(5, avgWin)));

  let threat = "Safe";
  if (zone === "danger" && trendVector === "retreating") threat = "Critical";
  else if (zone === "danger" || (trendVector === "retreating" && position < 0.5)) threat = "Elevated";
  else if (zone === "promotion" && trendVector === "advancing") threat = "Safe";

  return {
    rank, bandMin, bandMax, position, zone,
    control, threat, trendVector, slope,
    avgWin: Math.round(avgWin), avgLoss: Math.round(avgLoss),
    gamesToDemo, gamesToPromo, distFloor, distCeil,
  };
}
