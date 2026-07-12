// BrawlSpaces — multi-account tracker for alt accounts.
// Each space stores its own player data, battle log, and snapshots.
// When a space is selected, its data is loaded into the standard storage keys,
// so the rest of the app works unchanged.

const SPACES_KEY = "brawl_spaces_v1";
const ACTIVE_KEY = "active_brawl_space_v1";

const PLAYER_KEY = "ranked_player_data_v1";
const BATTLE_LOG_KEY = "ranked_battle_log_v2";
const SNAPSHOTS_KEY = "ranked_tracker_snapshots_v1";

export function getSpaces() {
  try {
    const raw = localStorage.getItem(SPACES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Guarantees at least one Space always exists so the multi-account UI is
// never empty on a fresh install. If no spaces exist, snapshot the current
// standard-key data into a "Main Account" space and mark it active.
export function ensureDefaultSpace() {
  const spaces = getSpaces();
  if (spaces.length > 0) {
    if (!getActiveSpaceId()) {
      localStorage.setItem(ACTIVE_KEY, spaces[0].id);
    }
    return spaces[0];
  }
  let playerData = null;
  let battleLog = [];
  let snapshots = [];
  try { playerData = JSON.parse(localStorage.getItem(PLAYER_KEY) || "null"); } catch { /* ignore */ }
  try { battleLog = JSON.parse(localStorage.getItem(BATTLE_LOG_KEY) || "[]"); } catch { /* ignore */ }
  try { snapshots = JSON.parse(localStorage.getItem(SNAPSHOTS_KEY) || "[]"); } catch { /* ignore */ }
  const seed = {
    id: Date.now().toString(),
    name: "Main Account",
    username: "",
    createdAt: new Date().toISOString(),
    playerData,
    battleLog,
    snapshots,
  };
  saveSpaces([seed]);
  localStorage.setItem(ACTIVE_KEY, seed.id);
  return seed;
}

function saveSpaces(spaces) {
  localStorage.setItem(SPACES_KEY, JSON.stringify(spaces));
}

export function getActiveSpaceId() {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function getActiveSpace() {
  const id = getActiveSpaceId();
  if (!id) return null;
  return getSpaces().find((s) => s.id === id) || null;
}

export function createSpace(name, username) {
  const spaces = getSpaces();
  const newSpace = {
    id: Date.now().toString(),
    name: name || "New Space",
    username: username || "",
    createdAt: new Date().toISOString(),
    playerData: null,
    battleLog: [],
    snapshots: [],
  };
  spaces.push(newSpace);
  saveSpaces(spaces);
  return newSpace;
}

export function updateSpace(id, updates) {
  const spaces = getSpaces();
  const idx = spaces.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  spaces[idx] = { ...spaces[idx], ...updates };
  saveSpaces(spaces);
  return spaces[idx];
}

export function deleteSpace(id) {
  const spaces = getSpaces().filter((s) => s.id !== id);
  saveSpaces(spaces);
  if (getActiveSpaceId() === id) {
    localStorage.removeItem(ACTIVE_KEY);
  }
  return spaces;
}

// Save current data from standard storage keys back to a space
export function saveCurrentToSpace(id) {
  const spaces = getSpaces();
  const idx = spaces.findIndex((s) => s.id === id);
  if (idx === -1) return;

  try {
    const playerData = JSON.parse(localStorage.getItem(PLAYER_KEY) || "{}");
    const battleLog = JSON.parse(localStorage.getItem(BATTLE_LOG_KEY) || "[]");
    const snapshots = JSON.parse(localStorage.getItem(SNAPSHOTS_KEY) || "[]");

    spaces[idx] = { ...spaces[idx], playerData, battleLog, snapshots };
    saveSpaces(spaces);
  } catch {
    // ignore parse errors
  }
}

// Load a space's data into the standard storage keys and set as active
export function loadSpaceData(id) {
  const spaces = getSpaces();
  const space = spaces.find((s) => s.id === id);
  if (!space) return;

  // First, save current data back to the previously active space
  const prevActive = getActiveSpaceId();
  if (prevActive && prevActive !== id) {
    saveCurrentToSpace(prevActive);
  }

  // Load the new space's data into standard keys
  if (space.playerData) {
    localStorage.setItem(PLAYER_KEY, JSON.stringify(space.playerData));
  }
  localStorage.setItem(BATTLE_LOG_KEY, JSON.stringify(space.battleLog || []));
  localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(space.snapshots || []));
  localStorage.setItem(ACTIVE_KEY, id);
}

// Save current data to the active space (call on app navigation away)
export function syncActiveSpace() {
  const id = getActiveSpaceId();
  if (id) saveCurrentToSpace(id);
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
}