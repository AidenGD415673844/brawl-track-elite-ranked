import { serve } from "https://deno.land/std@0.201.0/http/server.ts";

const BRAWL_KEY = Deno.env.get("BRAWLSTARS_API_TOKEN");
if (!BRAWL_KEY) console.error("Missing BRAWLSTARS_API_TOKEN env var");

async function brawlFetch(path) {
  const res = await fetch(`https://api.brawlstars.com/v1${path}`, {
    headers: {
      Authorization: `Bearer ${BRAWL_KEY}`,
      Accept: "application/json",
    },
  });
  return res;
}

serve(async (req) => {
  const url = new URL(req.url);

  // DEBUG: log what we receive so you can check Logs if needed
  console.log('incoming request pathname:', url.pathname);
  console.log('incoming search:', url.search);

  // Normalize pathname and extract route after any prefix
  const parts = url.pathname.split('/').filter(Boolean);
  const slugIndex = parts.findIndex(p => p === 'brawl-proxy' || p === 'bright-responder' || p === 'brawl-proxy-player');
  const routeParts = slugIndex >= 0 ? parts.slice(slugIndex + 1) : parts;
  const route = routeParts.join('/'); // e.g. 'player' or 'player/brawlers'

  const tag = url.searchParams.get('tag') || '';

  try {
    const call = async (brawlPath) => {
      const r = await brawlFetch(brawlPath);
      const text = await r.text();
      return new Response(text, { status: r.status, headers: { 'content-type': 'application/json' } });
    };

    // If the route explicitly ends with one of our endpoints, handle normally
    if (route.endsWith('player/brawlers')) {
      return await call(`/players/${encodeURIComponent(tag)}/brawlers`);
    }
    if (route.endsWith('player/battlelog')) {
      return await call(`/players/${encodeURIComponent(tag)}/battlelog`);
    }
    if (route.endsWith('player')) {
      return await call(`/players/${encodeURIComponent(tag)}`);
    }
    if (route.endsWith('club')) {
      return await call(`/clubs/${encodeURIComponent(tag)}`);
    }

    // Fallback: some test tools invoke the function root without the subpath
    // If a ?tag= is present, assume they want the player endpoint.
    if (tag) {
      console.log('No explicit route found but tag present — falling back to /player');
      return await call(`/players/${encodeURIComponent(tag)}`);
    }

    return new Response(JSON.stringify({ error: 'Unknown endpoint', hint: 'Use /player, /player/brawlers, /player/battlelog or /club and include ?tag=%23TAG' }), { status: 404, headers: { 'content-type': 'application/json' } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
});
