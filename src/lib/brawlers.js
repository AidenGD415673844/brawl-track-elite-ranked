// Brawler database, map list, and image URL helpers.
// Portraits served from Brawlify CDN using their numeric IDs.
// ID map is generated from https://api.brawlapi.com/v1/brawlers
import { BRAWLER_IDS } from "@/lib/brawlerIds";

const CDN_BORDER = "https://cdn.brawlify.com/brawlers/borders";
const CDN_BORDERLESS = "https://cdn.brawlify.com/brawlers/borderless";

// Look up ID with tolerant name matching (handles "El Primo", "Larry & Lawrie", etc.)
function findBrawlerId(name) {
  if (!name) return null;
  if (BRAWLER_IDS[name] != null) return BRAWLER_IDS[name];
  const norm = String(name).trim().toLowerCase();
  for (const k of Object.keys(BRAWLER_IDS)) {
    if (k.toLowerCase() === norm) return BRAWLER_IDS[k];
  }
  return null;
}

export function brawlerImageUrl(name, { borderless = false } = {}) {
  const id = findBrawlerId(name);
  if (id == null) return PLACEHOLDER_BRAWLER;
  return `${borderless ? CDN_BORDERLESS : CDN_BORDER}/${id}.png`;
}

// SVG placeholder for when a brawler image fails to load.
export const PLACEHOLDER_BRAWLER =
  "data:image/svg+xml;base64," +
  btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <rect width="80" height="80" rx="12" fill="#1e293b"/>
    <text x="40" y="48" font-size="32" text-anchor="middle" fill="#64748b" font-family="sans-serif" font-weight="bold">?</text>
  </svg>`);

export const BRAWLERS = [
  "8-Bit", "Amber", "Angelo", "Ash", "Barley", "Bea", "Belle", "Berry",
  "Bibi", "Bo", "Bonnie", "Brock", "Bull", "Buster", "Buzz", "Byron",
  "Carl", "Charlie", "Chester", "Chuck", "Clancy", "Colette", "Colt", "Cordelius",
  "Crow", "Darryl", "Doug", "Draco", "Dynamike", "Edgar", "El Primo", "Emz",
  "Eve", "Fang", "Frank", "Gale", "Gene", "Gray", "Griff", "Grom",
  "Gus", "Hank", "Jacky", "Janet", "Jessie", "Kenji", "Kit", "Larry & Lawrie",
  "Leon", "Lily", "Lola", "Lou", "Maddie", "Maisie", "Mandy", "Max",
  "Meg", "Melodie", "Mico", "Moe", "Mortis", "Mr. P", "Nani", "Nita",
  "Otis", "Pam", "Pearl", "Penny", "Piper", "Poco", "R-T", "Rico",
  "Rosa", "Ruffs", "Sam", "Sandy", "Shade", "Shelly", "Spike", "Sprout",
  "Squeak", "Starr Nova", "Stu", "Surge", "Tara", "Tick", "Willow",
];

export const MAPS = [
  "Skull Creek", "Backyard Bowl", "Super City Stadium", "Hard Rock Mine",
  "Cavern Churn", "Minecart Madness", "Undermine", "Mine Maze",
  "Open Business", "Picking Up Power", "Brawl Ball Arena", "Center Stage",
  "Kaboom Canyon", "Hot Potato", "Danger Zone", "Dueling Beetles",
  "Bloody Scissors", "Rockwall Brawl", "The Pit", "Snake Prairie",
  "Sunset Vista", "Goldarm Gulch", "Belle's Rock", "Feast or Famine",
  "New Horizons", "Catching Fire", "Safe Zone", "Ring of Fire",
  "Heat Wave", "Out in the Open", "Parallel Plays", "Hideout",
  "Shooting Star", "Gold Rush", "Blackwater Bridge", "Tornado Ring",
  "Ice Fort", "Frostbite Cavern", "Snowtel", "Crystal Arcade",
  "Other",
];