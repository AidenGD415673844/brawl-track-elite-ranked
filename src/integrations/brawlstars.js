// src/integrations/brawlstars.js
// Lightweight client that talks to the Supabase Edge Function proxy we added.

async function callProxy(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  // Use the Functions v1 path which works when called from the browser (same origin) or from deployed app
  const url = `/functions/v1/brawl-proxy/${path}${qs ? `?${qs}` : ''}`;
  const r = await fetch(url, { cache: 'no-store' });
  const text = await r.text();
  try { return JSON.parse(text); } catch { return text; }
}

export function fetchPlayer(tag) {
  const t = tag && tag.startsWith('#') ? tag : `#${tag}`;
  return callProxy('player', { tag: encodeURIComponent(t) });
}

export function fetchBrawlers(tag) {
  const t = tag && tag.startsWith('#') ? tag : `#${tag}`;
  return callProxy('player/brawlers', { tag: encodeURIComponent(t) });
}

export function fetchBattlelog(tag) {
  const t = tag && tag.startsWith('#') ? tag : `#${tag}`;
  return callProxy('player/battlelog', { tag: encodeURIComponent(t) });
}

export function fetchClub(tag) {
  const t = tag && tag.startsWith('#') ? tag : `#${tag}`;
  return callProxy('club', { tag: encodeURIComponent(t) });
}
