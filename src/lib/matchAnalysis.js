// Match analysis utilities — fairness indexing and what-if simulation.
import { calculateElo } from "@/lib/eloEngine";

// Compute matchmaking fairness for a battle entry.
// Returns { label, diff, color } where diff is enemyAvg - teamAvg.
export function computeFairness(entry) {
  const teamElos = [entry.playerElo, ...(entry.teammateElos || [])]
    .map(Number)
    .filter((e) => !isNaN(e) && e > 0);
  const enemyElos = (entry.enemyElos || [])
    .map(Number)
    .filter((e) => !isNaN(e) && e > 0);

  if (!teamElos.length || !enemyElos.length) return { label: null, diff: 0 };

  const teamAvg = teamElos.reduce((a, b) => a + b, 0) / teamElos.length;
  const enemyAvg = enemyElos.reduce((a, b) => a + b, 0) / enemyElos.length;
  const diff = Math.round(enemyAvg - teamAvg); // positive = team is underdog

  if (diff >= 200 && entry.result === "victory")
    return { label: "Underdog Victory", diff, color: "emerald" };
  if (diff >= 200 && entry.result === "defeat")
    return { label: "Hard Mode", diff, color: "orange" };
  if (diff <= -200 && entry.result === "defeat")
    return { label: "Upset Loss", diff, color: "red" };
  if (diff <= -200 && entry.result === "victory")
    return { label: "Expected Win", diff, color: "cyan" };
  if (Math.abs(diff) < 50)
    return { label: "Fair Match", diff, color: "slate" };
  if (diff > 0)
    return { label: "Slight Underdog", diff, color: "amber" };
  return { label: "Slight Favorite", diff, color: "blue" };
}

// Compute "MVP Resilience" — measures how often you're Star Player,
// especially in losses. High star-player rate in losses = you're playing
// well despite bad teams (high "luck factor" — performing above result).
// Returns { score (0-100), label, starRate, lossStarRate, totalGames, starCount }
export function computeMVPResilience(battleLog) {
  const real = (battleLog || []).filter((e) => !e.manual && e.result !== "draw");
  if (real.length === 0) {
    return { score: 0, label: "No data", starRate: 0, lossStarRate: 0, totalGames: 0, starCount: 0 };
  }

  const losses = real.filter((e) => e.result === "defeat");
  const starCount = real.filter((e) => e.starPlayer === "self" || e.starPlayer === true).length;
  const lossStars = losses.filter((e) => e.starPlayer === "self" || e.starPlayer === true).length;

  const starRate = starCount / real.length;
  const lossStarRate = losses.length > 0 ? lossStars / losses.length : 0;

  // Score formula: base star rate (50%) + loss star bonus (50%)
  // Being star player in a loss is the strongest signal of individual skill
  const baseScore = starRate * 50;
  const lossBonus = lossStarRate * 50;
  const score = Math.round(Math.min(100, baseScore + lossBonus));

  let label;
  if (score >= 75) label = "Clutch King";
  else if (score >= 55) label = "Consistent MVP";
  else if (score >= 35) label = "Solid Performer";
  else if (score >= 15) label = "Team Dependent";
  else label = "Needs Impact";

  return {
    score,
    label,
    starRate: Math.round(starRate * 100),
    lossStarRate: Math.round(lossStarRate * 100),
    totalGames: real.length,
    starCount,
  };
}

// Compute what would have happened if the result was flipped.
export function computeWhatIf(entry) {
  const flippedResult =
    entry.result === "victory" ? "defeat"
    : entry.result === "defeat" ? "victory"
    : "draw";

  const calc = calculateElo(entry.playerElo, {
    result: flippedResult,
    teammateElos: entry.teammateElos || [],
    enemyElos: entry.enemyElos || [],
    seasonRefreshed: entry.seasonRefreshed,
    queueType: entry.queueType,
    highestElo: entry.highestElo || entry.playerElo,
    starPlayer: entry.starPlayer === "self" || entry.starPlayer === true,
  });

  return {
    flippedResult,
    eloAfter: calc.eloAfter,
    delta: calc.delta,
  };
}