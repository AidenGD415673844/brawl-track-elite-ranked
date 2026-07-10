// Lightweight haptic helper. Uses the Vibration API when available and
// gated by a user Setting so it never fires unexpectedly.

const KEY = "hapticsEnabled";
const OVERRIDE_KEY = "tiltOverrideCount";
const OVERRIDE_REMINDED_KEY = "tiltOverrideReminded";

export function areHapticsEnabled() {
  try {
    const v = localStorage.getItem(KEY);
    return v === null ? true : v === "1";
  } catch { return true; }
}

export function setHapticsEnabled(enabled) {
  try { localStorage.setItem(KEY, enabled ? "1" : "0"); } catch {}
}

export function vibrate(pattern = 20) {
  if (!areHapticsEnabled()) return;
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
    }
  } catch {}
}

// Big celebratory buzz reserved for tier promotions.
export function vibratePromotion() {
  vibrate([30, 40, 60, 40, 120]);
}

// Anti-tilt override tracking — used to surface a soft "take a break" nudge
// after N overrides in a single session.
export function recordTiltOverride() {
  try {
    const n = Number(sessionStorage.getItem(OVERRIDE_KEY) || "0") + 1;
    sessionStorage.setItem(OVERRIDE_KEY, String(n));
    return n;
  } catch { return 0; }
}

export function shouldShowTiltReminder(threshold = 3) {
  try {
    const n = Number(sessionStorage.getItem(OVERRIDE_KEY) || "0");
    const reminded = sessionStorage.getItem(OVERRIDE_REMINDED_KEY) === "1";
    if (n >= threshold && !reminded) {
      sessionStorage.setItem(OVERRIDE_REMINDED_KEY, "1");
      return true;
    }
    return false;
  } catch { return false; }
}
