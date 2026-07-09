// Regression-to-Mean analysis — compares actual recent win rate
// to the Elo-expected win rate. Large deviations signal that
// performance will likely "regress to the mean."
//
// Overperforming (actual >> expected): expect a cool-down
// Underperforming (actual << expected): positive regression incoming

export function computeRegression(battleLog) {
  const real = (battleLog || []).filter((e) => !e.manual && e.result !== "draw");
  if (real.length < 5) return null;

  const recent = real.slice(0, Math.min(15, real.length));

  let expectedSum = 0;
  let actualWins = 0;

  recent.forEach((entry) => {
    const playerElo = Number(entry.playerElo);
    const enemyElos = (entry.enemyElos || []).map(Number).filter((e) => e > 0);
    const enemyAvg = enemyElos.length > 0
      ? enemyElos.reduce((a, b) => a + b, 0) / enemyElos.length
      : playerElo;

    // Standard Elo expected score formula
    const diff = playerElo - enemyAvg;
    const expected = 1 / (1 + Math.pow(10, -diff / 400));
    expectedSum += expected;

    if (entry.result === "victory") actualWins++;
  });

  const expectedWinRate = (expectedSum / recent.length) * 100;
  const actualWinRate = (actualWins / recent.length) * 100;
  const deviation = actualWinRate - expectedWinRate;

  let status, label, description, color;
  if (deviation > 15) {
    status = "overperforming";
    label = "Overperforming";
    description = "Win rate exceeds Elo expectation — expect a cool-down";
    color = "#f59e0b";
  } else if (deviation < -15) {
    status = "underperforming";
    label = "Underperforming";
    description = "Win rate below Elo expectation — positive regression incoming";
    color = "#22d3ee";
  } else {
    status = "expected";
    label = "At Expected Level";
    description = "Performance aligns with Elo — stable trajectory";
    color = "#10b981";
  }

  return {
    expectedWinRate: Math.round(expectedWinRate),
    actualWinRate: Math.round(actualWinRate),
    deviation: Math.round(deviation),
    status,
    label,
    description,
    color,
    sampleSize: recent.length,
  };
}