// Deserved Rank Engine — turns a 4-step self assessment (Mechanics, Game IQ,
// Resilience, Brawler Pool) plus objective battle-log data (win rate, star
// player rate / "impact grades", streak stability) into a Deserved Elo.
//
// Design:
//   • Each of the 4 categories has 5 questions, scored 0..100 by the wizard.
//   • Category scores are converted to Elo contributions using per-category
//     weights (Mechanics 40, Game IQ 40, Resilience 20, Brawler Pool 20 Elo
//     per point). Total possible baseline ≈ 100 * (40+40+20+20) = 12,000.
//   • Data-driven adjustments layer on top:
//       – Win rate delta from 50% (± up to 800 Elo)
//       – Star player rate ("impact grade" proxy) (± up to 400)
//       – Streak stability — punishes wild swings (± up to 300)
//       – Consistency: sample size confidence multiplier
//   • Final Elo clamped [0, 12500], mapped to nearest sub-rank via getRank.

import { RANKS, getRank, getRankIndex } from "@/lib/ranks";

export const CATEGORIES = [
  {
    id: "mechanics",
    label: "Mechanics",
    subtitle: "Aim, movement, super timing",
    weight: 40, // Elo per point (0..100)
    color: { from: "#22d3ee", to: "#0ea5e9", text: "#7dd3fc" },
    questions: [
      { id: "aim", label: "How consistent is your aim under pressure?" },
      { id: "dodge", label: "How well do you dodge enemy supers/shots?" },
      { id: "positioning", label: "How solid is your map positioning?" },
      { id: "superTiming", label: "How well do you time your supers?" },
      { id: "reactions", label: "How fast are your reactions in 1v1s?" },
    ],
  },
  {
    id: "gameIQ",
    label: "Game IQ",
    subtitle: "Draft, map reads, macro decisions",
    weight: 40,
    color: { from: "#a78bfa", to: "#7c3aed", text: "#c4b5fd" },
    questions: [
      { id: "drafting", label: "How strong is your draft / brawler pick?" },
      { id: "mapKnowledge", label: "How well do you know every ranked map?" },
      { id: "counters", label: "Do you know the matchup counters?" },
      { id: "rotations", label: "Do you rotate correctly with your team?" },
      { id: "objective", label: "Do you play the objective, not just kills?" },
    ],
  },
  {
    id: "resilience",
    label: "Mental Game",
    subtitle: "Tilt control, focus, consistency",
    weight: 20,
    color: { from: "#f472b6", to: "#db2777", text: "#f9a8d4" },
    questions: [
      { id: "tilt", label: "How well do you avoid tilting after a loss?" },
      { id: "focus", label: "Can you keep focus across long sessions?" },
      { id: "comebacks", label: "Do you play well when behind?" },
      { id: "criticism", label: "How well do you take teammate mistakes?" },
      { id: "queueControl", label: "Do you stop playing on a loss streak?" },
    ],
  },
  {
    id: "brawlerPool",
    label: "Brawler Pool",
    subtitle: "Depth, mastery, meta coverage",
    weight: 20,
    color: { from: "#fbbf24", to: "#f97316", text: "#fde047" },
    questions: [
      { id: "poolSize", label: "How large is your maxed brawler pool?" },
      { id: "roles", label: "Do you cover every role (tank/assassin/support)?" },
      { id: "meta", label: "Do you own the current meta brawlers at max?" },
      { id: "gadgets", label: "Do you know the best gadget/gear per brawler?" },
      { id: "flex", label: "Can you flex into a rare pick when drafting?" },
    ],
  },
];

// Default: all 50 (neutral).
export function defaultResponses() {
  const out = {};
  for (const cat of CATEGORIES) {
    out[cat.id] = {};
    for (const q of cat.questions) out[cat.id][q.id] = 50;
  }
  return out;
}

// Average 0..100 of a category
function categoryScore(responses, catId) {
  const cat = CATEGORIES.find((c) => c.id === catId);
  if (!cat) return 50;
  const vals = cat.questions.map((q) => Number(responses?.[catId]?.[q.id] ?? 50));
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// Best win streak in last N battles
function bestStreak(log) {
  let best = 0, cur = 0;
  for (const e of [...log].reverse()) {
    if (e.result === "victory") { cur++; best = Math.max(best, cur); }
    else cur = 0;
  }
  return best;
}

// Streak stability score 0..100 — inverse of loss-streak volatility.
function streakStability(log) {
  if (log.length === 0) return 50;
  let worstLoss = 0, cur = 0;
  for (const e of log) {
    if (e.result === "defeat") { cur++; worstLoss = Math.max(worstLoss, cur); }
    else cur = 0;
  }
  // 0 losses in a row = 100; 8+ = 0
  return Math.max(0, Math.min(100, 100 - worstLoss * 12));
}

/**
 * Main computation.
 * Returns { deservedElo, currentRank, deservedRank, deltaIdx, categories, adjustments }
 */
// ─── Feedback engine ────────────────────────────────────────
// Turns the raw responses + battle-log signals into specific,
// human-readable focus notes. Used by DeservedRankReveal and
// stored on the result for history rehydration.
function buildFocusNotes(responses, real, stability, best) {
  const notes = [];
  // Lowest-scoring individual question inside each category.
  for (const cat of CATEGORIES) {
    let lowest = null;
    for (const q of cat.questions) {
      const v = Number(responses?.[cat.id]?.[q.id] ?? 50);
      if (!lowest || v < lowest.v) lowest = { q, v };
    }
    if (lowest && lowest.v <= 40) {
      notes.push({
        category: cat.label,
        severity: lowest.v <= 25 ? "high" : "medium",
        text: `${cat.label}: ${lowest.q.label.replace(/\?$/, "")} scored ${lowest.v}/100 — pick this as your daily rep.`,
      });
    }
  }
  // Battle-log driven notes.
  if (real.length >= 10) {
    const wins = real.filter((e) => e.result === "victory").length;
    const wr = Math.round((wins / real.length) * 100);
    if (wr < 45) notes.push({ category: "Battle log", severity: "high", text: `Win rate ${wr}% over last ${real.length} — queue only your top-3 brawlers this week.` });
    else if (wr >= 60) notes.push({ category: "Battle log", severity: "low", text: `Win rate ${wr}% — keep momentum, avoid experimenting with off-meta picks now.` });
  }
  if (stability <= 40) {
    notes.push({ category: "Mental", severity: "high", text: `Loss streaks are hurting you (stability ${Math.round(stability)}/100). Hard-stop after 2 losses in a row.` });
  }
  if (best >= 6) {
    notes.push({ category: "Momentum", severity: "low", text: `You've hit a ${best}-win streak — you can climb hard, log matches while the feel is on.` });
  }
  return notes.slice(0, 5);
}

// ─── Rank-gap explainer ─────────────────────────────────────
function buildGapExplanation(deltaElo, adjustments, baseElo) {
  if (Math.abs(deltaElo) < 150) {
    return "Your current Elo lines up with your true skill. Small gap, likely just ladder variance.";
  }
  // Sort adjustments by absolute impact to find the biggest drivers.
  const sorted = [...adjustments]
    .filter((a) => a.value !== undefined)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  const top = sorted.slice(0, 2).map((a) => a.label);
  const dir = deltaElo > 0 ? "higher" : "lower";
  return `You're sitting ${Math.abs(deltaElo).toLocaleString()} Elo ${dir} than deserved. Biggest drivers: ${top.join(", ")}. Baseline from self-assessment: ${baseElo.toLocaleString()}.`;
}

export function computeDeservedRank(player, responses, battleLog = []) {
  const currentElo = Math.max(0, Number(player?.currentElo) || 0);
  const real = (battleLog || []).filter((e) => !e.manual);

  // ─── Baseline from self-assessment (STRICT) ─────────────
  // Casual players self-score around 50s. Under the old formula that
  // handed them Legendary. New curve: cube-root of avg/100 flattens
  // low scores, a harsh -1800 floor removes automatic climbs, and
  // sample-size confidence is required to unlock high tiers.
  let rawBase = 0;
  const catBreakdown = CATEGORIES.map((cat) => {
    const score = categoryScore(responses, cat.id);
    // Nonlinear curve: 50 → 35% of weight, 70 → 59%, 90 → 85%, 100 → 100%.
    const curved = Math.pow(score / 100, 1.6) * 100;
    const contribution = Math.round(curved * cat.weight * 0.75); // 25% haircut
    rawBase += contribution;
    return {
      id: cat.id,
      label: cat.label,
      subtitle: cat.subtitle,
      color: cat.color,
      score: Math.round(score),
      contribution,
      max: Math.round(cat.weight * 100 * 0.75),
    };
  });
  const baseElo = Math.max(0, rawBase - 1800);

  // ─── Data-driven adjustments (also stricter) ────────────
  const winRate = Number(player?.winRate) || 50;
  const wrAdj = Math.round(((winRate - 55) / 45) * 700); // 50% wr = -78, 60% = +78

  const starCount = real.filter((e) => e.starPlayer === "self").length;
  const starRate = real.length > 0 ? starCount / real.length : 0;
  const impactAdj = Math.max(-500, Math.min(400, Math.round((starRate - 0.25) * 2000)));

  const stability = streakStability(real);
  const stabilityAdj = Math.round(((stability - 60) / 40) * 350);

  const best = bestStreak(real);
  const streakBonus = best >= 12 ? 200 : best >= 8 ? 100 : best >= 5 ? 40 : 0;

  const confidence = Math.min(1, real.length / 30);

  const adjustments = [
    { label: `Base (self-assessment)`,           value: baseElo,      good: true },
    { label: `Win rate (${winRate}%)`,           value: wrAdj },
    { label: `Star player (${Math.round(starRate * 100)}%)`, value: impactCapped(impactAdj) },
    { label: `Consistency (${Math.round(stability)}/100)`,   value: stabilityAdj },
    { label: `Best streak (${best})`,            value: streakBonus },
  ];

  const totalAdjust = wrAdj + impactCapped(impactAdj) + stabilityAdj + streakBonus;
  let deservedElo = Math.max(0, baseElo + totalAdjust);

  // ─── Evidence gates: high tiers require real proof ─────
  // Masters (8250+) needs ≥20 real matches AND winRate ≥58%.
  // Pro (11250+) needs ≥40 matches AND winRate ≥62% AND ≥30% star rate.
  if (deservedElo >= 8250 && !(real.length >= 20 && winRate >= 58)) {
    deservedElo = Math.min(deservedElo, 8000);
  }
  if (deservedElo >= 11250 && !(real.length >= 40 && winRate >= 62 && starRate >= 0.3)) {
    deservedElo = Math.min(deservedElo, 10500);
  }
  // Low-confidence samples get capped at Diamond III until they prove themselves.
  if (confidence < 0.3 && deservedElo > 4499) {
    deservedElo = 4499;
  }
  deservedElo = Math.min(RANKS[RANKS.length - 1].min + 2000, deservedElo);

  const currentRank = getRank(currentElo);
  const deservedRank = getRank(deservedElo);
  const currentIdx = getRankIndex(currentElo);
  const deservedIdx = getRankIndex(deservedElo);
  const deltaIdx = deservedIdx - currentIdx;
  const deltaElo = Math.round(deservedElo - currentElo);

  let verdictClass = "deserved";
  let verdict;
  if (Math.abs(deltaIdx) <= 2) {
    verdict = `You're right where you belong. Your profile and recent play line up with ${currentRank.name}.`;
  } else if (deltaIdx > 2) {
    verdictClass = "under";
    verdict = `You're under-ranked. Your true skill sits closer to ${deservedRank.name}. Push harder in ranked.`;
  } else {
    verdictClass = "over";
    verdict = `You're over-ranked. ${deservedRank.name} matches your profile better. Focus on fundamentals to defend.`;
  }

  const focusNotes = buildFocusNotes(responses, real, stability, best);
  const gapExplanation = buildGapExplanation(deltaElo, adjustments, baseElo);

  return {
    deservedElo: Math.round(deservedElo),
    currentElo,
    currentRank,
    deservedRank,
    deltaIdx,
    deltaElo,
    verdict,
    verdictClass,
    baseElo,
    totalAdjust,
    categories: catBreakdown,
    adjustments,
    confidence,
    sampleSize: real.length,
    focusNotes,
    gapExplanation,
  };
}
