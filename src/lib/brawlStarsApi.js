// Brawl Stars API client + mock data generator.
// Fetches ranked battle logs via a server-side edge function proxy,
// or generates realistic mock data for testing without an API key.
import { MODES } from "@/lib/battleLog";
import { BRAWLERS } from "@/lib/brawlers";
import { isMockDataEnabled, getPlayerTag, setPlayerTag } from "@/lib/appSettings";

async function getBackendClient() {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    return supabase;
  } catch {
    throw new Error(
      "Backend configuration is missing in this build. Publish/update the app again from Lovable, or enable Mock Data in Settings."
    );
  }
}


// ─── Mock Data ────────────────────────────────────────────────

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate a single mock ranked battle near the player's current Elo.
function generateMockBattle(currentElo) {
  const result = Math.random() < 0.55 ? "victory" : Math.random() < 0.1 ? "draw" : "defeat";
  const mode = rand(MODES);
  const duration = randInt(60, 180);

  const spread = () => currentElo + randInt(-300, 300);
  const teammateElos = [spread(), spread()];
  const enemyElos = [spread(), spread(), spread()];

  const pickBrawler = () => rand(BRAWLERS);
  const brawlers = {
    self: pickBrawler(),
    mate1: pickBrawler(),
    mate2: pickBrawler(),
    mate3: pickBrawler(),
    enemy1: pickBrawler(),
    enemy2: pickBrawler(),
    enemy3: pickBrawler(),
  };

  const starPlayer = rand(["self", "mate1", "mate2", "mate3", "enemy1", "enemy2", "enemy3"]);

  // Generate teammate profiles for squad dashboard data
  const teammateProfiles = teammateElos.map((elo) => ({
    highestElo: elo + randInt(0, 500),
    lastSeasonElo: elo - randInt(0, 300),
    trophies: randInt(1000, 30000),
    skill: randInt(3, 10),
  }));

  const perfKeys = { "Gem Grab": "gems", "Heist": "damage", "Hot Zone": "control", "Brawl Ball": "goals", "Bounty": "stars", "Knockout": "kos" };
  const perfKey = perfKeys[mode];
  const performance = perfKey ? { [perfKey]: randInt(1, 15) } : null;

  return {
    mode,
    result,
    brawlers,
    starPlayer,
    duration,
    teammateElos,
    teammateProfiles,
    enemyElos,
    queueType: "solo",
    performance,
    seasonRefreshed: false,
  };
}

export function generateMockBattles(currentElo, count = 8) {
  const battles = [];
  for (let i = 0; i < count; i++) {
    battles.push(generateMockBattle(currentElo));
  }
  return battles;
}

// ─── API Fetch ────────────────────────────────────────────────

const API_BASE = "https://api.brawlstars.com/v1";

// Map API mode names to our internal MODES list.
const MODE_MAP = {
  gemGrab: "Gem Grab",
  heist: "Heist",
  hotZone: "Hot Zone",
  brawlBall: "Brawl Ball",
  bounty: "Bounty",
  knockout: "Knockout",
};

function mapApiBattle(item, playerTag) {
  const battle = item.battle || {};
  const teams = battle.teams || [];

  // Find which team the player is on
  let playerTeam = null;
  let enemyTeam = null;
  const normalizedTag = playerTag.toUpperCase().replace("#", "");

  for (let i = 0; i < teams.length; i++) {
    const found = teams[i].find(
      (p) => (p.tag || "").toUpperCase().replace("#", "") === normalizedTag
    );
    if (found) {
      playerTeam = teams[i];
      enemyTeam = teams[(i + 1) % teams.length];
      break;
    }
  }

  if (!playerTeam || !enemyTeam) return null;

  const mode = MODE_MAP[battle.mode] || MODE_MAP[item.event?.mode] || "Gem Grab";
  const result = battle.result === "victory" ? "victory"
    : battle.result === "defeat" ? "defeat" : "draw";

  const starTag = battle.starPlayer?.tag?.toUpperCase().replace("#", "");
  const brawlerKeys = ["self", "mate1", "mate2", "mate3"];
  const enemyKeys = ["enemy1", "enemy2", "enemy3"];

  const brawlers = {};
  const teammateElos = [];
  const teammateProfiles = [];
  let starPlayer = null;

  playerTeam.forEach((p, i) => {
    const key = i === 0 ? "self" : `mate${i}`;
    brawlers[key] = p.brawler?.name || "";
    if (i > 0) {
      // Estimate Elo from brawler trophies (rough proxy)
      const estElo = Math.max(0, Math.round((p.brawler?.trophies || 500) * 6));
      teammateElos.push(estElo);
      teammateProfiles.push({
        highestElo: estElo,
        lastSeasonElo: estElo,
        trophies: p.brawler?.trophies || 0,
        skill: 5,
      });
    }
    if (starTag && (p.tag || "").toUpperCase().replace("#", "") === starTag) {
      starPlayer = key;
    }
  });

  const enemyElos = [];
  enemyTeam.forEach((p, i) => {
    brawlers[enemyKeys[i]] = p.brawler?.name || "";
    const estElo = Math.max(0, Math.round((p.brawler?.trophies || 500) * 6));
    enemyElos.push(estElo);
    if (starTag && (p.tag || "").toUpperCase().replace("#", "") === starTag) {
      starPlayer = enemyKeys[i];
    }
  });

  // Pad arrays: 2 teammates, 3 enemies
  while (teammateElos.length < 2) teammateElos.push(0);
  while (enemyElos.length < 3) enemyElos.push(0);

  return {
    mode,
    result,
    brawlers,
    starPlayer,
    duration: battle.duration || null,
    teammateElos,
    teammateProfiles,
    enemyElos,
    queueType: "solo",
    performance: null,
    seasonRefreshed: false,
  };
}

export async function fetchRankedBattles(playerTag) {
  const supabase = await getBackendClient();
  const { data, error } = await supabase.functions.invoke("fetch-battles", {
    body: { playerTag },
  });

  if (error) {
    throw new Error(error.message || "Failed to fetch battles.");
  }
  if (data?.error) {
    throw new Error(data.error);
  }

  const items = data?.items || [];
  const ranked = items.filter(
    (item) => item.battle?.type === "ranked" || item.event?.mode === "ranked"
  );

  if (ranked.length === 0) {
    return { battles: [], empty: true };
  }

  const battles = ranked
    .map((item) => mapApiBattle(item, playerTag))
    .filter(Boolean);

  return { battles, empty: battles.length === 0 };
}

// Main entry point: returns { battles, empty, error, mock }
export async function fetchBattles(currentElo) {
  // Mock data mode — skip API entirely
  if (isMockDataEnabled()) {
    return { battles: generateMockBattles(currentElo), mock: true };
  }

  // Get or prompt for player tag
  let playerTag = getPlayerTag();
  if (!playerTag) {
    playerTag = window.prompt("Enter your Brawl Stars Player Tag (e.g. #2PPPPPPPP):");
    if (!playerTag || playerTag.trim() === "") {
      return { error: "Player tag is required to fetch logs." };
    }
    playerTag = playerTag.trim();
    setPlayerTag(playerTag);
  }

  try {
    const result = await fetchRankedBattles(playerTag);
    return { ...result, mock: false };
  } catch (err) {
    return { error: err.message || "Failed to fetch battles." };
  }
}
