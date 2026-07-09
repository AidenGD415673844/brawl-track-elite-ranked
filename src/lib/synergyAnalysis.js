// Synergy analysis — computes a live A-F grade from historical battle data
// based on the current brawler + teammate brawler combination.

// Compute a synergy grade from the battle log given the current team composition.
// brawlers: { self, mate1, mate2, ... } — brawler names currently selected
// battleLog: full battle log array
// Returns { grade, winRate, games, label, color, insight }
export function computeSynergyGrade(brawlers, battleLog) {
  const real = (battleLog || []).filter((e) => !e.manual);
  if (!real.length) return { grade: null, games: 0, label: "No Data", color: "#64748b" };

  const selfBrawler = brawlers?.self;
  if (!selfBrawler) return { grade: null, games: 0, label: "No Data", color: "#64748b" };

  // Collect selected teammate brawlers (non-empty)
  const mateBrawlers = [brawlers?.mate1, brawlers?.mate2, brawlers?.mate3]
    .filter(Boolean);

  // Find battles where the player used the same brawler
  let matches = real.filter((e) => {
    const b = e.brawler || e.brawlers?.self;
    return b === selfBrawler;
  });

  // If teammate brawlers are selected, further filter to battles where
  // at least one of those teammate brawlers was present in the same team
  if (mateBrawlers.length > 0) {
    const withMates = matches.filter((e) => {
      const teamBrawlers = [
        e.brawlers?.mate1, e.brawlers?.mate2, e.brawlers?.mate3,
      ].filter(Boolean);
      return mateBrawlers.some((mb) => teamBrawlers.includes(mb));
    });
    // Use the more specific filter if it has data, otherwise fall back
    if (withMates.length >= 2) matches = withMates;
  }

  if (matches.length < 2) {
    return {
      grade: null,
      games: matches.length,
      label: "Insufficient Data",
      color: "#64748b",
      insight: `Only ${matches.length} match(es) with ${selfBrawler}${mateBrawlers.length ? ` + ${mateBrawlers.join("/")}` : ""}. Play more to grade your synergy.`,
    };
  }

  const wins = matches.filter((e) => e.result === "victory").length;
  const winRate = Math.round((wins / matches.length) * 100);

  let grade, label, color, insight;
  if (winRate >= 65) {
    grade = "A";
    label = "Elite Synergy";
    color = "#10b981";
    insight = `Dominating with ${winRate}% win rate over ${matches.length} games.`;
  } else if (winRate >= 55) {
    grade = "B";
    label = "Strong Combo";
    color = "#84cc16";
    insight = `Solid ${winRate}% win rate — this composition clicks.`;
  } else if (winRate >= 45) {
    grade = "C";
    label = "Balanced";
    color = "#eab308";
    insight = `Average ${winRate}% — room to optimize this lineup.`;
  } else if (winRate >= 35) {
    grade = "D";
    label = "Struggling";
    color = "#f97316";
    insight = `Below average at ${winRate}% — consider swapping a brawler.`;
  } else {
    grade = "F";
    label = "Poor Match";
    color = "#ef4444";
    insight = `Only ${winRate}% win rate — this combo isn't working.`;
  }

  return { grade, winRate, games: matches.length, label, color, insight };
}