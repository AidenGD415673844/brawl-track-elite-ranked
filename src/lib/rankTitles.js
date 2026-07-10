// Tongue-in-cheek adaptive titles for each sub-rank.
// Purely cosmetic — never influences Elo, matching, or storage.
//
// getRankTitle("Diamond III", { winStreak, lossStreak, deservedGap })
//   → { title, subtitle, modifier }

const TITLES = {
  "Bronze I":      "The one who thinks Shelly is broken",
  "Bronze II":     "Learning that Piper has range",
  "Bronze III":    "Bought the Brawl Pass, still Bronze",
  "Silver I":      "Auto-aim enthusiast",
  "Silver II":     "Owns a Gadget but forgets to press it",
  "Silver III":    "Randoms enthusiast",
  "Gold I":        "Discovered the ban phase exists",
  "Gold II":       "Gets carried on Heist",
  "Gold III":      "One trick away from Diamond",
  "Diamond I":     "Officially safe from the reset",
  "Diamond II":    "Blames teammates in every mode",
  "Diamond III":   "Spends 6 hours grinding, never reaches Mythic",
  "Mythic I":      "Bans Kenji, first-picks Mortis",
  "Mythic II":     "Has opinions about map rotation",
  "Mythic III":    "Two wins away from Legendary — for the 4th week",
  "Legendary I":   "Actually reads the enemy comp",
  "Legendary II":  "Owns every meta brawler at Power 11",
  "Legendary III": "Screenshots losses for review",
  "Masters I":     "You're the reason your teammates tilt",
  "Masters II":    "Solo-queue warrior with a duo Discord",
  "Masters III":   "Pro-adjacent. Almost.",
  "Pro":           "Touch grass. Please.",
};

const DEFAULT_TITLE = "Ranked ladder connoisseur";

export function getRankTitle(rankName, context = {}) {
  const title = TITLES[rankName] || DEFAULT_TITLE;
  const { winStreak = 0, lossStreak = 0, deservedGap = 0 } = context;

  let modifier = "";
  if (winStreak >= 5) modifier = "on a heater";
  else if (lossStreak >= 3) modifier = "in a tilt spiral";
  else if (deservedGap >= 300) modifier = "and underranked";
  else if (deservedGap <= -300) modifier = "riding luck";

  return {
    title,
    modifier,
    // Compose helper for one-line renderers.
    line: modifier ? `${title} — ${modifier}` : title,
  };
}

// Pick the best "highest rank" to caption from a player object.
// Prefers season-highest, falls back to lifetime highest, then current.
export function pickTitleRankName(player, ranksModule) {
  const { getRank } = ranksModule;
  const elo = Math.max(
    Number(player?.currentSeasonHighest) || 0,
    Number(player?.highestElo) || 0,
    Number(player?.currentElo) || 0,
  );
  return getRank(elo)?.name || "Bronze I";
}
