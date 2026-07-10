// Deterministic "deserved rank" analyser.
// No AI — a weighted point system that turns a filled checklist plus the
// player's stored profile and battle log into a true-skill Elo estimate,
// snapped to the nearest sub-rank. Then compares to the current rank.
//
// Verdicts (delta = deservedIdx - currentIdx, both are sub-rank indices):
//   |delta| <= 2  → "you deserve your current rank"
//   delta  >  2   → "you're under-ranked" (climb harder)
//   delta  < -2   → "you're over-ranked" (defend hard)

import { RANKS, getRank, getRankIndex } from "@/lib/ranks";

// Checklist presets. Each entry has a scoring weight (Elo points).
// Values in the range [-1, +1] are multiplied by the weight and summed
// on top of a "baseline" Elo derived from current + peak.
export const CHECKLIST_QUESTIONS = [
  {
    id: "trophies",
    label: "Total trophies",
    weight: 800,
    options: [
      { value: -1,   label: "Under 15,000" },
      { value: -0.5, label: "15k – 30k" },
      { value: 0,    label: "30k – 50k" },
      { value: 0.5,  label: "50k – 75k" },
      { value: 1,    label: "75k+" },
    ],
  },
  {
    id: "consistency",
    label: "Long-term win rate",
    weight: 700,
    options: [
      { value: -1,   label: "Below 45%" },
      { value: -0.4, label: "45% – 50%" },
      { value: 0,    label: "50% – 55%" },
      { value: 0.6,  label: "55% – 60%" },
      { value: 1,    label: "Above 60%" },
    ],
  },
  {
    id: "recentForm",
    label: "Recent form (last 20 battles)",
    weight: 500,
    options: [
      { value: -1,   label: "Mostly losing" },
      { value: -0.4, label: "Slightly negative" },
      { value: 0,    label: "Even" },
      { value: 0.5,  label: "Positive streaks" },
      { value: 1,    label: "Dominant" },
    ],
  },
  {
    id: "skill",
    label: "Self-rated skill (1–10)",
    weight: 700,
    options: [
      { value: -1,   label: "1 – 3 (beginner)" },
      { value: -0.4, label: "4 – 5 (casual)" },
      { value: 0.2,  label: "6 – 7 (solid)" },
      { value: 0.7,  label: "8 – 9 (strong)" },
      { value: 1,    label: "10 (elite)" },
    ],
  },
  {
    id: "power",
    label: "Power 11 brawlers",
    weight: 450,
    options: [
      { value: -1,   label: "0 – 2" },
      { value: -0.3, label: "3 – 5" },
      { value: 0.2,  label: "6 – 10" },
      { value: 0.6,  label: "11 – 20" },
      { value: 1,    label: "20+" },
    ],
  },
  {
    id: "queue",
    label: "Most common queue",
    weight: 300,
    options: [
      { value: -0.3, label: "Solo random" },
      { value: 0.1,  label: "Mixed" },
      { value: 0.6,  label: "Duo premade" },
      { value: 1,    label: "Trio premade" },
    ],
  },
  {
    id: "starRate",
    label: "Star player rate",
    weight: 400,
    options: [
      { value: -1,   label: "Rarely (<10%)" },
      { value: -0.2, label: "Sometimes (10–20%)" },
      { value: 0.3,  label: "Often (20–35%)" },
      { value: 0.8,  label: "Frequent (35–50%)" },
      { value: 1,    label: "Star magnet (50%+)" },
    ],
  },
  {
    id: "bestStreak",
    label: "Best win streak this season",
    weight: 350,
    options: [
      { value: -0.5, label: "Under 3" },
      { value: 0,    label: "3 – 5" },
      { value: 0.4,  label: "6 – 9" },
      { value: 0.8,  label: "10 – 14" },
      { value: 1,    label: "15+" },
    ],
  },
  {
    id: "gameKnowledge",
    label: "Game & meta knowledge",
    weight: 400,
    options: [
      { value: -1,   label: "Learning the basics" },
      { value: -0.3, label: "Know common picks" },
      { value: 0.3,  label: "Know all matchups" },
      { value: 0.7,  label: "Know draft counters" },
      { value: 1,    label: "Meta expert" },
    ],
  },
];

// Auto-fill sensible defaults from stored player + battle log
export function suggestChecklist(player, battleLog = []) {
  const trophies = player.trophies || 0;
  const winRate = player.winRate || 50;
  const skill = player.skill || 5;
  const p11 = player.power11Brawlers || 0;

  const real = (battleLog || []).filter((e) => !e.manual).slice(0, 20);
  const wins20 = real.filter((e) => e.result === "victory").length;
  const losses20 = real.filter((e) => e.result === "defeat").length;
  const diff = wins20 - losses20;

  const starTotal = real.filter((e) => e.starPlayer === "self").length;
  const starRate = real.length > 0 ? starTotal / real.length : 0;
  const bestStreak = (function () {
    let best = 0, cur = 0;
    for (const e of [...real].reverse()) {
      if (e.result === "victory") { cur++; best = Math.max(best, cur); }
      else cur = 0;
    }
    return best;
  })();

  const pick = (id, val) => {
    const q = CHECKLIST_QUESTIONS.find((x) => x.id === id);
    // Find closest option
    let best = q.options[0];
    let bestDist = Math.abs(q.options[0].value - val);
    for (const opt of q.options) {
      const d = Math.abs(opt.value - val);
      if (d < bestDist) { best = opt; bestDist = d; }
    }
    return best.value;
  };

  const trophyVal = trophies < 15000 ? -1 : trophies < 30000 ? -0.5 : trophies < 50000 ? 0 : trophies < 75000 ? 0.5 : 1;
  const consVal   = winRate < 45 ? -1 : winRate < 50 ? -0.4 : winRate < 55 ? 0 : winRate < 60 ? 0.6 : 1;
  const formVal   = diff <= -6 ? -1 : diff < 0 ? -0.4 : diff === 0 ? 0 : diff < 6 ? 0.5 : 1;
  const skillVal  = skill <= 3 ? -1 : skill <= 5 ? -0.4 : skill <= 7 ? 0.2 : skill <= 9 ? 0.7 : 1;
  const powerVal  = p11 <= 2 ? -1 : p11 <= 5 ? -0.3 : p11 <= 10 ? 0.2 : p11 <= 20 ? 0.6 : 1;
  const starVal   = starRate < 0.1 ? -1 : starRate < 0.2 ? -0.2 : starRate < 0.35 ? 0.3 : starRate < 0.5 ? 0.8 : 1;
  const streakVal = bestStreak < 3 ? -0.5 : bestStreak < 6 ? 0 : bestStreak < 10 ? 0.4 : bestStreak < 15 ? 0.8 : 1;

  return {
    trophies: pick("trophies", trophyVal),
    consistency: pick("consistency", consVal),
    recentForm: pick("recentForm", formVal),
    skill: pick("skill", skillVal),
    power: pick("power", powerVal),
    queue: 0.1,
    starRate: pick("starRate", starVal),
    bestStreak: pick("bestStreak", streakVal),
    gameKnowledge: 0.3,
  };
}

/**
 * Compute the deserved rank from checklist answers + player profile.
 * Returns:
 *   { currentRank, deservedRank, deltaIdx, verdict, verdictClass, trueElo, breakdown }
 */
export function computeDeservedRank(player, answers) {
  const current = Math.max(0, player.currentElo || 0);
  const peak = Math.max(player.highestElo || 0, player.lastSeasonElo || 0, current);

  // Baseline: 60% peak Elo + 40% current Elo — anchors deserved rank near
  // what the player has already achieved.
  const baseline = 0.6 * peak + 0.4 * current;

  let modifier = 0;
  const breakdown = [];
  for (const q of CHECKLIST_QUESTIONS) {
    const a = answers?.[q.id];
    const val = typeof a === "number" ? a : 0;
    const pts = Math.round(val * q.weight);
    modifier += pts;
    breakdown.push({ id: q.id, label: q.label, value: val, points: pts });
  }

  // Clamp trueElo into supported range
  let trueElo = Math.max(0, Math.min(RANKS[RANKS.length - 1].min + 3000, baseline + modifier));

  const currentRank = getRank(current);
  const deservedRank = getRank(trueElo);
  const currentIdx = getRankIndex(current);
  const deservedIdx = getRankIndex(trueElo);
  const deltaIdx = deservedIdx - currentIdx;

  let verdictClass = "deserved";
  let verdict;
  if (Math.abs(deltaIdx) <= 2) {
    verdictClass = "deserved";
    verdict = `You're right where you belong. Your profile and recent play line up with ${currentRank.name}. Keep grinding — a promotion is close, not overdue.`;
  } else if (deltaIdx > 2) {
    verdictClass = "under";
    if (deltaIdx >= 6) {
      verdict = `You're heavily under-ranked. Your stats point at ${deservedRank.name}, way above ${currentRank.name}. Play more Ranked — the climb should be fast.`;
    } else if (deltaIdx >= 4) {
      verdict = `You're clearly under-ranked. ${deservedRank.name} matches your skill profile better than ${currentRank.name}. Time to push.`;
    } else {
      verdict = `You're mildly under-ranked. You should be closer to ${deservedRank.name}. A short win streak will fix that.`;
    }
  } else {
    verdictClass = "over";
    if (deltaIdx <= -6) {
      verdict = `You're significantly over-ranked. ${deservedRank.name} matches your profile — defending ${currentRank.name} will be brutal without improvement.`;
    } else if (deltaIdx <= -4) {
      verdict = `You're over-ranked. ${deservedRank.name} suits your stats better than ${currentRank.name}. Expect turbulence.`;
    } else {
      verdict = `You're slightly over-ranked. ${deservedRank.name} would be a fairer home. Focus on fundamentals to hold your current rank.`;
    }
  }

  return {
    currentRank,
    deservedRank,
    currentIdx,
    deservedIdx,
    deltaIdx,
    verdict,
    verdictClass,
    trueElo: Math.round(trueElo),
    baseline: Math.round(baseline),
    modifier,
    breakdown,
  };
}
