// Elo Velocity & Momentum — rolling-window pace analysis.
import { getRank, RANKS } from "@/lib/ranks";

function ratedChrono(log) {
  return (log || [])
    .filter((e) => !e.manual && typeof e.eloAfter === "number" && (e.result === "victory" || e.result === "defeat"))
    .slice()
    .reverse(); // oldest → newest
}

function windowStats(rated, n) {
  if (rated.length < 2) return null;
  const slice = rated.slice(-n);
  if (slice.length < 2) return null;
  const first = slice[0];
  const last = slice[slice.length - 1];
  const eloDelta = (last.eloAfter || 0) - (first.playerElo || first.eloAfter || 0);
  const tFirst = new Date(first.timestamp).getTime();
  const tLast = new Date(last.timestamp).getTime();
  const hours = Math.max(0.01, (tLast - tFirst) / 3600000);
  return {
    games: slice.length,
    eloDelta,
    perGame: Math.round(eloDelta / slice.length),
    perHour: Math.round(eloDelta / hours),
    spanHours: Math.round(hours * 10) / 10,
  };
}

export function computeVelocity(battleLog) {
  const rated = ratedChrono(battleLog);
  if (rated.length < 3) {
    return { empty: true, verdict: "No Data", perGame: 0, perHour: 0, windows: {}, timeToNext: null, sparkline: [] };
  }
  const w10 = windowStats(rated, 10);
  const w25 = windowStats(rated, 25);
  const w50 = windowStats(rated, 50);

  // Trend across windows: use perGame to detect acceleration / stall.
  const trend = [w50?.perGame ?? 0, w25?.perGame ?? 0, w10?.perGame ?? 0];
  const accel = trend[2] > trend[1] && trend[1] > trend[0] && trend[2] > 5;
  const stall = Math.abs(w10?.eloDelta ?? 0) <= 5 && (w10?.games || 0) >= 8;

  const perGame = w10?.perGame ?? 0;
  const perHour = w10?.perHour ?? 0;

  let verdict = "Cruising";
  if (accel) verdict = "Rocket 🚀";
  else if (stall) verdict = "Stalling";
  else if (perGame >= 15) verdict = "Climbing";
  else if (perGame <= -10) verdict = "Sliding";

  // Time to next rank at current per-game pace.
  const currentElo = rated[rated.length - 1].eloAfter;
  const currentRank = getRank(currentElo);
  const nextRank = RANKS[RANKS.indexOf(currentRank) + 1];
  let timeToNext = null;
  if (nextRank && perGame > 0) {
    const gamesNeeded = Math.ceil((nextRank.min - currentElo) / perGame);
    const hoursNeeded = w10?.spanHours && w10.games ? (gamesNeeded / w10.games) * w10.spanHours : null;
    timeToNext = { rank: nextRank.name, games: gamesNeeded, hours: hoursNeeded ? Math.round(hoursNeeded * 10) / 10 : null };
  }

  // Simple sparkline of last-20 eloAfter values.
  const sparkline = rated.slice(-20).map((e) => e.eloAfter);

  return { empty: false, verdict, perGame, perHour, windows: { w10, w25, w50 }, timeToNext, sparkline, accel, stall };
}
