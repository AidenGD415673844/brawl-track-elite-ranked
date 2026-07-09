// Coach analysis — tilt detection and session insights from the battle log.
// Analyzes recent matches to detect losing streaks, fatigue patterns,
// and below-average performance dips.

// Returns a coaching insight object based on the most recent matches.
// battleLog: full log array (newest-first as stored)
// Returns { isTilting, streakType, streakCount, message, severity, suggestion }
export function analyzeTilt(battleLog) {
  const real = (battleLog || []).filter((e) => !e.manual);
  if (real.length < 3) return { isTilting: false, hasData: false };

  // Get the current streak (newest-first)
  const recent = real.slice(0, 10);
  const currentResult = recent[0].result;

  // Count consecutive losses or wins from the top
  let streakCount = 0;
  if (currentResult === "defeat") {
    for (const e of recent) {
      if (e.result === "defeat") streakCount++;
      else break;
    }
  } else if (currentResult === "victory") {
    for (const e of recent) {
      if (e.result === "victory") streakCount++;
      else break;
    }
  }

  // Calculate overall win rate vs recent win rate
  const overallWins = real.filter((e) => e.result === "victory").length;
  const overallWR = overallWins / real.length;

  const recentWins = recent.filter((e) => e.result === "victory").length;
  const recentWR = recentWins / recent.length;

  // Tilt conditions:
  // 1. 3+ losses in a row
  // 2. Recent win rate is 15%+ below overall average (with at least 5 recent games)
  const lossStreak = currentResult === "defeat" ? streakCount : 0;
  const performanceDip = recent.length >= 5 && (overallWR - recentWR) >= 0.15;

  if (lossStreak >= 3) {
    const severity = lossStreak >= 5 ? "high" : lossStreak >= 4 ? "medium" : "low";
    const messages = {
      low: `${lossStreak}-game losing streak detected.`,
      medium: `You're on a ${lossStreak}-game losing streak. Time to reset.`,
      high: `Major tilt alert: ${lossStreak} losses in a row. Step back.`,
    };
    const suggestions = {
      low: "Consider switching modes or taking a short break.",
      medium: "Take a 10-minute break or try a different game mode.",
      high: "Strongly recommend a 15+ minute break. Your win rate is dropping.",
    };
    return {
      isTilting: true,
      hasData: true,
      streakType: "loss",
      streakCount: lossStreak,
      message: messages[severity],
      suggestion: suggestions[severity],
      severity,
      recentWR: Math.round(recentWR * 100),
      overallWR: Math.round(overallWR * 100),
    };
  }

  if (performanceDip) {
    return {
      isTilting: true,
      hasData: true,
      streakType: "dip",
      streakCount: 0,
      message: `Recent win rate (${Math.round(recentWR * 100)}%) is below your average (${Math.round(overallWR * 100)}%).`,
      suggestion: "You may be fatigued. Try a break or switch brawlers.",
      severity: "low",
      recentWR: Math.round(recentWR * 100),
      overallWR: Math.round(overallWR * 100),
    };
  }

  // Positive streak
  if (currentResult === "victory" && streakCount >= 3) {
    return {
      isTilting: false,
      hasData: true,
      streakType: "win",
      streakCount,
      message: `🔥 ${streakCount}-game win streak! You're in the zone.`,
      suggestion: "Keep the momentum — but don't over-queue.",
      severity: "positive",
      recentWR: Math.round(recentWR * 100),
      overallWR: Math.round(overallWR * 100),
    };
  }

  return {
    isTilting: false,
    hasData: true,
    streakType: "neutral",
    streakCount: 0,
    message: null,
    severity: "neutral",
    recentWR: Math.round(recentWR * 100),
    overallWR: Math.round(overallWR * 100),
  };
}