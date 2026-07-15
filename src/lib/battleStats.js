// Shared battle statistics — single source of truth for average win/loss
// deltas used across all prediction models (simulator, predictor, territory
// forecast). Falls back to a standard 90 / -50 when there is no data.
export const FALLBACK_AVG_WIN = 90;
export const FALLBACK_AVG_LOSS = -50;

export function getAvgDeltas(battleLog) {
  const log = (battleLog || []).filter(
    (e) => !e.manual && typeof e.delta === "number" && Number.isFinite(e.delta)
  );
  const wins = log.filter((e) => e.result === "victory" && e.delta > 0).map((e) => e.delta);
  const losses = log.filter((e) => e.result === "defeat" && e.delta < 0).map((e) => e.delta);

  const avgWin = wins.length
    ? Math.round(wins.reduce((a, b) => a + b, 0) / wins.length)
    : FALLBACK_AVG_WIN;
  const avgLoss = losses.length
    ? Math.round(losses.reduce((a, b) => a + b, 0) / losses.length)
    : FALLBACK_AVG_LOSS;

  return {
    avgWin,
    avgLoss,
    winSample: wins.length,
    lossSample: losses.length,
    sample: wins.length + losses.length,
    hasData: wins.length + losses.length > 0,
  };
}

// Rolling win rate over last N rated battles. Falls back to `fallback`.
export function getRecentWinRate(battleLog, n = 20, fallback = 50) {
  const rated = (battleLog || [])
    .filter((e) => !e.manual && (e.result === "victory" || e.result === "defeat"))
    .slice(0, n);
  if (!rated.length) return fallback;
  const wins = rated.filter((e) => e.result === "victory").length;
  return Math.round((wins / rated.length) * 100);
}
