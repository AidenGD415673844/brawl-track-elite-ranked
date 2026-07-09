// Free real-time P2P data sync via LiveKit WebRTC + BroadcastChannel fallback.
// Tokens are minted by a server-side edge function so the LiveKit API secret
// never touches the browser.
import { Room, RoomEvent, DataPacket_Kind } from "livekit-client";
import { supabase } from "@/integrations/supabase/client";

const CHANNEL_NAME = "brawl-track-sync";

let room = null;
let broadcastChannel = null;
let receiveCallback = null;
let currentRoomName = null;
let livekitConfigured = null; // cached availability check

// Ask the server whether LiveKit is configured. The token endpoint returns
// 500 with a clear error when the secrets are missing, which we use as the
// availability probe (no secrets ever leave the server).
async function checkLiveKitAvailable() {
  if (livekitConfigured !== null) return livekitConfigured;
  try {
    const { data, error } = await supabase.functions.invoke("livekit-token", {
      body: { roomName: "probe-check", identity: "probe-check" },
    });
    livekitConfigured = !!(data && data.token && data.url && !error);
  } catch {
    livekitConfigured = false;
  }
  return livekitConfigured;
}

// Kept for compatibility with existing UI; credentials no longer live in the
// browser. `hasCredentials` now reflects server-side LiveKit availability.
export function getCredentials() {
  return null;
}
export function setCredentials() {
  // No-op: LiveKit credentials are now managed server-side.
}
export function clearCredentials() {
  livekitConfigured = null;
}
export function hasCredentials() {
  return livekitConfigured === true;
}

// --- Connection management ---
export function isConnected() {
  return (room && room.state === "connected") || !!broadcastChannel;
}

export function getCurrentRoom() {
  return currentRoomName;
}




export function generateRoomName() {
  return "brawl-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function setupBroadcastChannel() {
  if (broadcastChannel) return;
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    broadcastChannel.onmessage = (e) => {
      if (e.data?.type === "battle" && receiveCallback) {
        receiveCallback(e.data.entry);
      }
    };
  } catch {
    broadcastChannel = null;
  }
}

export async function createRoom() {
  const roomName = generateRoomName();
  await connect(roomName);
  return roomName;
}

export async function joinRoom(roomName) {
  await connect(roomName);
}

async function connect(roomName) {
  currentRoomName = roomName;

  // Always set up BroadcastChannel for same-browser sync
  setupBroadcastChannel();

  // Try LiveKit connection via server-side token mint
  try {
    const { data, error } = await supabase.functions.invoke("livekit-token", {
      body: { roomName, identity: "player-" + Math.random().toString(36).substring(2, 8) },
    });
    if (error || !data?.token || !data?.url) {
      livekitConfigured = false;
      return;
    }
    livekitConfigured = true;

    if (room) {
      await room.disconnect();
      room = null;
    }

    room = new Room();
    room.on(RoomEvent.DataReceived, (payload) => {
      try {
        const text = new TextDecoder().decode(payload);
        const parsed = JSON.parse(text);
        if (parsed.type === "battle" && receiveCallback) {
          receiveCallback(parsed.entry);
        }
      } catch {
        // Malformed payload — ignore
      }
    });

    await room.connect(data.url, data.token);
  } catch {
    // LiveKit connection failed — BroadcastChannel still works for local sync
    room = null;
  }
}


export function broadcastBattle(entry) {
  const payload = { type: "battle", entry };

  // Broadcast via BroadcastChannel (same-browser, cross-tab)
  if (broadcastChannel) {
    broadcastChannel.postMessage(payload);
  }

  // Broadcast via LiveKit DataChannel (cross-device)
  if (room && room.state === "connected") {
    try {
      const data = new TextEncoder().encode(JSON.stringify(payload));
      room.localParticipant.publishData(data, DataPacket_Kind.RELIABLE);
    } catch {
      // Publish failed — non-critical
    }
  }
}

export function onReceiveBattle(callback) {
  receiveCallback = callback;
}

export function disconnect() {
  if (room) {
    room.disconnect();
    room = null;
  }
  if (broadcastChannel) {
    broadcastChannel.close();
    broadcastChannel = null;
  }
  receiveCallback = null;
  currentRoomName = null;
}