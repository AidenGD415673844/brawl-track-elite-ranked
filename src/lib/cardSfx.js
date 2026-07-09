const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

// Dedicated SFX module for Battle Card clicks and Season End Report ONLY.
// Uses a separate audio file with tier-specific timestamps.
// DO NOT use this for rank-up animations — those use sfx.js.

const CARD_AUDIO_FILE =
  "/__l5e/assets-v1/94e1ec95-d490-4c9f-9d01-f7135580899d/card_sfx.mp3";

// Bronze & Silver now use a separate user-provided file with its own timestamps.
const BRONZE_SILVER_AUDIO_FILE =
  "/__l5e/assets-v1/d3bb9563-1f44-4346-8fc8-ecb675c8f528/bronze_silver_sfx.mp3";

// Tier-specific timestamps (seconds).
// Bronze/Silver come from BRONZE_SILVER_AUDIO_FILE; the rest from CARD_AUDIO_FILE.
const CARD_SFX = {
  Bronze:    { start: 1,  end: 2.5, file: "bronzeSilver" },
  Silver:    { start: 3,  end: 5.5, file: "bronzeSilver" },
  Gold:      { start: 5,  end: 8 },
  Diamond:   { start: 8,  end: 11 },
  Mythic:    { start: 11, end: 14 },
  Legendary: { start: 14, end: 17 },
  Masters:   { start: 17, end: 20 },
  Pro:       { start: 20, end: 23 },
};

let cardAudioEl = null;
let bronzeSilverAudioEl = null;
let cardInitPromise = null;
let pauseTimeoutRef = null;

function loadAudio(src) {
  const el = new Audio();
  el.src = src;
  el.preload = "auto";
  el.crossOrigin = "anonymous";
  return new Promise((resolve) => {
    if (el.readyState >= 2) return resolve(el);
    const handler = () => resolve(el);
    el.addEventListener("canplay", handler, { once: true });
    el.addEventListener("loadeddata", handler, { once: true });
    setTimeout(() => resolve(el), 3000);
  });
}

async function initCardAudio() {
  if (cardInitPromise) return cardInitPromise;
  cardInitPromise = (async () => {
    try {
      [cardAudioEl, bronzeSilverAudioEl] = await Promise.all([
        loadAudio(CARD_AUDIO_FILE),
        loadAudio(BRONZE_SILVER_AUDIO_FILE),
      ]);
    } catch {
      cardAudioEl = null;
      bronzeSilverAudioEl = null;
    }
  })();
  return cardInitPromise;
}

// Play the card SFX for a given tier. Used ONLY by:
// 1. BattleCardGallery (card equip click)
// 2. SeasonEndReport (season card reveal)
export async function playCardSFX(tier) {
  const seg = CARD_SFX[tier];
  if (!seg) return;
  await initCardAudio();

  const el = seg.file === "bronzeSilver" ? bronzeSilverAudioEl : cardAudioEl;
  if (!el) return;

  // Clear any pending pause from a previous click so rapid re-triggering works
  if (pauseTimeoutRef) {
    clearTimeout(pauseTimeoutRef);
    pauseTimeoutRef = null;
  }

  // Pause both elements before seeking — required for rapid re-triggering and
  // so a Bronze click doesn't overlap a still-playing Gold clip.
  if (cardAudioEl) cardAudioEl.pause();
  if (bronzeSilverAudioEl) bronzeSilverAudioEl.pause();
  try {
    el.currentTime = seg.start;
  } catch {
    // Seek failed
  }

  el.play().catch(() => {});

  const duration = (seg.end - seg.start) * 1000;
  pauseTimeoutRef = setTimeout(() => {
    el.pause();
    pauseTimeoutRef = null;
  }, duration);
}

// Pre-initialize audio on first user interaction
export function primeCardAudio() {
  initCardAudio();
}