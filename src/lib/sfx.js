const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

// Rank-up SFX system using a master audio file with hardcoded timestamps.
// Plays scale intro first, then voiceover segment after intro completes.
// Uses Web Audio API for echo/spaciousness with reliable fallback.

const AUDIO_FILE =
  "/__l5e/assets-v1/d30a38fb-17f3-4cba-b249-7ba90a22a53a/rank_sfx.mp3";

// Hardcoded timestamps (seconds) for each rank.
// `start/end` = voiceover segment; `scaleStart/scaleEnd` = scale SFX (no voiceover, intro).
const RANK_AUDIO = {
  "Bronze I":      { start: 2,     end: 5,     scaleStart: 12,  scaleEnd: 15 },
  "Bronze II":     { start: 5,     end: 8,     scaleStart: 12,  scaleEnd: 15 },
  "Bronze III":    { start: 9,     end: 12,    scaleStart: 12,  scaleEnd: 15 },
  "Silver I":      { start: 16,    end: 19,    scaleStart: 26,  scaleEnd: 29 },
  "Silver II":     { start: 19,    end: 23,    scaleStart: 26,  scaleEnd: 29 },
  "Silver III":    { start: 23,    end: 26,    scaleStart: 26,  scaleEnd: 29 },
  "Gold I":        { start: 30,    end: 33,    scaleStart: 41,  scaleEnd: 44 },
  "Gold II":       { start: 34,    end: 37,    scaleStart: 41,  scaleEnd: 44 },
  "Gold III":      { start: 37,    end: 41,    scaleStart: 41,  scaleEnd: 44 },
  "Diamond I":     { start: 46,    end: 49,    scaleStart: 57,  scaleEnd: 61 },
  "Diamond II":    { start: 50,    end: 53,    scaleStart: 57,  scaleEnd: 61 },
  "Diamond III":   { start: 53,    end: 57,    scaleStart: 57,  scaleEnd: 61 },
  "Mythic I":      { start: 61,    end: 65,    scaleStart: 74,  scaleEnd: 77 },
  "Mythic II":     { start: 66,    end: 70,    scaleStart: 74,  scaleEnd: 77 },
  "Mythic III":    { start: 70,    end: 74,    scaleStart: 74,  scaleEnd: 77 },
  "Legendary I":   { start: 79,    end: 83,    scaleStart: 93,  scaleEnd: 96 },
  "Legendary II":  { start: 83,    end: 87,    scaleStart: 93,  scaleEnd: 96 },
  "Legendary III": { start: 88,    end: 91,    scaleStart: 93,  scaleEnd: 96 },
  "Masters I":     { start: 98,    end: 101,   scaleStart: 111, scaleEnd: 114 },
  "Masters II":    { start: 102,   end: 105,   scaleStart: 111, scaleEnd: 114 },
  "Masters III":   { start: 106,   end: 109,   scaleStart: 111, scaleEnd: 114 },
  "Pro":           { start: 115.5, end: 118.1, scaleStart: 115.5, scaleEnd: 118.1 },
};

let audioEl = null;
let audioCtx = null;
let mediaSource = null;
let dryGain = null;
let wetGain = null;
let delayNode = null;
let convolver = null;
let pauseTimer = null;
let initPromise = null;

function createImpulseResponse(ctx, duration, decay) {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const impulse = ctx.createBuffer(2, length, sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

async function initAudio() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      audioEl = new Audio();
      audioEl.src = AUDIO_FILE;
      audioEl.preload = "auto";
      audioEl.crossOrigin = "anonymous";

      // Wait for audio data to be ready (with timeout fallback)
      await new Promise((resolve) => {
        if (audioEl.readyState >= 2) return resolve();
        const handler = () => resolve();
        audioEl.addEventListener("canplay", handler, { once: true });
        audioEl.addEventListener("loadeddata", handler, { once: true });
        setTimeout(resolve, 3000);
      });

      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        mediaSource = audioCtx.createMediaElementSource(audioEl);

        dryGain = audioCtx.createGain();
        dryGain.gain.value = 0.8;

        delayNode = audioCtx.createDelay(1.0);
        delayNode.delayTime.value = 0.18;

        convolver = audioCtx.createConvolver();
        convolver.buffer = createImpulseResponse(audioCtx, 1.5, 2.0);

        wetGain = audioCtx.createGain();
        wetGain.gain.value = 0;

        mediaSource.connect(dryGain);
        dryGain.connect(audioCtx.destination);
        mediaSource.connect(delayNode);
        delayNode.connect(convolver);
        convolver.connect(wetGain);
        wetGain.connect(audioCtx.destination);
      } catch {
        mediaSource = null;
      }
    } catch {
      audioEl = null;
    }
  })();
  return initPromise;
}

function playSegment(start, end, withEcho = false) {
  return initAudio().then(() => {
    if (!audioEl) return Promise.resolve();

    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }

    if (wetGain) {
      wetGain.gain.value = withEcho ? 0.35 : 0;
    }

    if (pauseTimer) {
      clearTimeout(pauseTimer);
      pauseTimer = null;
    }

    return new Promise((resolve) => {
      let started = false;

      const startPlayback = () => {
        if (started) return;
        started = true;

        const playPromise = audioEl.play();
        const schedulePause = () => {
          const duration = (end - start) * 1000;
          pauseTimer = setTimeout(() => {
            audioEl.pause();
            resolve();
          }, duration);
        };

        if (playPromise && typeof playPromise.then === "function") {
          playPromise.then(schedulePause).catch(() => resolve());
        } else {
          schedulePause();
        }
      };

      // Seek to the target position, wait for seek to complete, then play
      try {
        if (Math.abs(audioEl.currentTime - start) < 0.05) {
          startPlayback();
        } else {
          const onSeeked = () => {
            audioEl.removeEventListener("seeked", onSeeked);
            startPlayback();
          };
          audioEl.addEventListener("seeked", onSeeked, { once: true });
          audioEl.currentTime = start;
          // Fallback: if "seeked" doesn't fire within 300ms, play anyway
          setTimeout(() => {
            audioEl.removeEventListener("seeked", onSeeked);
            startPlayback();
          }, 300);
        }
      } catch {
        startPlayback();
      }
    });
  });
}

// Play voiceover segment directly (no scale intro before it)
export async function playRankSFX(rank, withVoiceover = true) {
  if (!withVoiceover) {
    playRankClickSFX(rank);
    return;
  }
  const seg = RANK_AUDIO[rank.name];
  if (!seg) return;

  // Voiceover segment with echo — no intro SFX played beforehand
  await playSegment(seg.start, seg.end, true);
}

// Play the rank's scale SFX (no voiceover, no echo) — used for manual clicks
export function playRankClickSFX(rank) {
  const seg = RANK_AUDIO[rank.name];
  if (!seg) return;
  playSegment(seg.scaleStart, seg.scaleEnd, false);
}

// Play the scale SFX for a tier (used on manual scale clicks)
export function playScaleSFX(tier) {
  const tierRank = Object.keys(RANK_AUDIO).find((name) => name.startsWith(tier));
  if (!tierRank) return;
  const seg = RANK_AUDIO[tierRank];
  playSegment(seg.scaleStart, seg.scaleEnd, false);
}

// Pre-initialize audio on first user interaction (call from a click handler)
export function primeAudio() {
  initAudio();
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
}