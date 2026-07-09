// App settings — API key stored in sessionStorage (clears on tab close)
// for improved security over localStorage.
// Note: Full server-side proxying requires a backend function (Builder+).
// Once credits reset on Aug 1, we'll create a backend proxy that uses
// the BRAWL_STARS_API_KEY secret so the key never touches the client.
const MOCK_DATA_KEY = "ranked_mock_data_enabled";
const API_KEY_STORAGE = "BRAWL_STARS_API_KEY";
const PLAYER_TAG_KEY = "BRAWL_STARS_PLAYER_TAG";

export function isMockDataEnabled() {
  try {
    return localStorage.getItem(MOCK_DATA_KEY) === "true";
  } catch {
    return false;
  }
}

export function setMockDataEnabled(enabled) {
  try {
    localStorage.setItem(MOCK_DATA_KEY, enabled ? "true" : "false");
  } catch {
    // ignore
  }
}

// API key uses sessionStorage — cleared when the browser tab closes
export function getApiKey() {
  try {
    return sessionStorage.getItem(API_KEY_STORAGE);
  } catch {
    return null;
  }
}

export function setApiKey(key) {
  try {
    sessionStorage.setItem(API_KEY_STORAGE, key);
  } catch {
    // ignore
  }
}

export function clearApiKey() {
  try {
    sessionStorage.removeItem(API_KEY_STORAGE);
  } catch {
    // ignore
  }
}

// Player tag is not sensitive — stays in localStorage for convenience
export function getPlayerTag() {
  try {
    return localStorage.getItem(PLAYER_TAG_KEY);
  } catch {
    return null;
  }
}

export function setPlayerTag(tag) {
  try {
    localStorage.setItem(PLAYER_TAG_KEY, tag);
  } catch {
    // ignore
  }
}