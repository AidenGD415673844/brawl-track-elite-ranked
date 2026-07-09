// localStorage persistence for player data.
const PLAYER_KEY = "ranked_player_data_v1";

export const DEFAULT_PLAYER = {
  currentElo: 4200,
  highestElo: 4800,
  lastSeasonElo: 4600,
  currentSeasonHighest: 4200,
  trophies: 5200,
  winRate: 58,
  gamesPlayed: 320,
  winStreak: 6,
  skill: 7,
  teamElos: [],
  seasonRefreshed: false,
  power9Brawlers: 0,
  power11Brawlers: 0,
  matePower9: [0, 0],
  matePower11: [0, 0],
  equippedCard: null,
  seasonStartDate: null,
};

export function loadPlayer() {
  try {
    const raw = localStorage.getItem(PLAYER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_PLAYER,
        ...parsed,
        currentSeasonHighest: parsed.currentSeasonHighest ?? parsed.currentElo ?? 0,
        teamElos: parsed.teamElos || [],
        seasonRefreshed: parsed.seasonRefreshed || false,
      };
    }
  } catch {
    // fall through
  }
  return { ...DEFAULT_PLAYER };
}

export function savePlayer(player) {
  try {
    localStorage.setItem(PLAYER_KEY, JSON.stringify(player));
  } catch {
    // ignore
  }
}

export function clearPlayer() {
  localStorage.removeItem(PLAYER_KEY);
}