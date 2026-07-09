// Achievement system — deterministic badge unlocks based on battle log data.
import { getBestWinStreak } from "@/lib/battleLog";

export const ACHIEVEMENTS = [
  {
    id: "first_blood",
    name: "First Blood",
    description: "Log your first ranked battle",
    icon: "Sword",
    check: (log) => log.length >= 1,
  },
  {
    id: "ten_battles",
    name: "Getting Serious",
    description: "Log 10 ranked battles",
    icon: "Flag",
    check: (log) => log.length >= 10,
  },
  {
    id: "fifty_battles",
    name: "Battle Veteran",
    description: "Log 50 ranked battles",
    icon: "Shield",
    check: (log) => log.length >= 50,
  },
  {
    id: "streak_3",
    name: "Hot Streak",
    description: "Win 3 battles in a row",
    icon: "Flame",
    check: (log) => getBestWinStreak(log) >= 3,
  },
  {
    id: "streak_5",
    name: "On Fire",
    description: "Win 5 battles in a row",
    icon: "Zap",
    check: (log) => getBestWinStreak(log) >= 5,
  },
  {
    id: "streak_10",
    name: "Unstoppable",
    description: "Win 10 battles in a row",
    icon: "Rocket",
    check: (log) => getBestWinStreak(log) >= 10,
  },
  {
    id: "streak_20",
    name: "Godlike",
    description: "Win 20 battles in a row",
    icon: "Crown",
    check: (log) => getBestWinStreak(log) >= 20,
  },
  {
    id: "reach_gold",
    name: "Gold Tier",
    description: "Reach Gold rank (1500 Elo)",
    icon: "Medal",
    check: (log, player) => (player?.highestElo || 0) >= 1500,
  },
  {
    id: "reach_diamond",
    name: "Diamond Hands",
    description: "Reach Diamond rank (3000 Elo)",
    icon: "Gem",
    check: (log, player) => (player?.highestElo || 0) >= 3000,
  },
  {
    id: "reach_mythic",
    name: "Mythic Ascension",
    description: "Reach Mythic rank (4500 Elo)",
    icon: "Sparkles",
    check: (log, player) => (player?.highestElo || 0) >= 4500,
  },
  {
    id: "reach_legendary",
    name: "Legend",
    description: "Reach Legendary rank (6000 Elo)",
    icon: "Trophy",
    check: (log, player) => (player?.highestElo || 0) >= 6000,
  },
  {
    id: "star_player",
    name: "Star Player",
    description: "Earn Star Player in a match",
    icon: "Star",
    check: (log) => log.some((e) => e.starPlayer),
  },
  {
    id: "comeback_king",
    name: "Comeback King",
    description: "Win immediately after a 3+ loss streak",
    icon: "RotateCcw",
    check: (log) => {
      const reversed = [...log].reverse();
      for (let i = 0; i <= reversed.length - 4; i++) {
        if (
          reversed[i]?.result === "victory" &&
          reversed[i + 1]?.result === "defeat" &&
          reversed[i + 2]?.result === "defeat" &&
          reversed[i + 3]?.result === "defeat"
        ) {
          return true;
        }
      }
      return false;
    },
  },
  {
    id: "mode_master",
    name: "Mode Master",
    description: "Win 10 battles in a single game mode",
    icon: "Target",
    check: (log) => {
      const modeWins = {};
      for (const e of log) {
        if (e.result === "victory") {
          modeWins[e.mode] = (modeWins[e.mode] || 0) + 1;
          if (modeWins[e.mode] >= 10) return true;
        }
      }
      return false;
    },
  },
  {
    id: "brawler_main",
    name: "Brawler Main",
    description: "Win 10 battles with a single brawler",
    icon: "Users",
    check: (log) => {
      const brawlerWins = {};
      for (const e of log) {
        if (e.result === "victory" && e.brawler) {
          brawlerWins[e.brawler] = (brawlerWins[e.brawler] || 0) + 1;
          if (brawlerWins[e.brawler] >= 10) return true;
        }
      }
      return false;
    },
  },
];

export function checkAchievements(battleLog, player) {
  const real = (battleLog || []).filter((e) => !e.manual);
  return ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: a.check(real, player),
  }));
}

export function getUnlockedCount(battleLog, player) {
  return checkAchievements(battleLog, player).filter((a) => a.unlocked).length;
}