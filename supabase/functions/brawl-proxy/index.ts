import { serve } from "https://deno.land/std@0.201.0/http/server.ts";

const BRAWL_KEY = Deno.env.get("BRAWLSTARS_API_TOKEN");

if (!BRAWL_KEY) {
  console.error("Missing BRAWLSTARS_API_TOKEN env var");
}

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
  const pathname = url.pathname.replace(/^\/+/, ""); // remove leading slash
  const search = url.searchParams;
  try {
    if (pathname === "player/brawlers") {
      const tag = search.get("tag") || "";
      const r = await brawlFetch(`/players/${encodeURIComponent(tag)}/brawlers`);
      const json = await r.text();
      return new Response(json, { status: r.status, headers: { "content-type": "application/json" } });
    }

    if (pathname === "player/battlelog") {
      const tag = search.get("tag") || "";
      const r = await brawlFetch(`/players/${encodeURIComponent(tag)}/battlelog`);
      const json = await r.text();
      return new Response(json, { status: r.status, headers: { "content-type": "application/json" } });
    }

    if (pathname === "player") {
      const tag = search.get("tag") || "";
      const r = await brawlFetch(`/players/${encodeURIComponent(tag)}`);
      const json = await r.text();
      return new Response(json, { status: r.status, headers: { "content-type": "application/json" } });
    }

    if (pathname === "club") {
      const tag = search.get("tag") || "";
      const r = await brawlFetch(`/clubs/${encodeURIComponent(tag)}`);
      const json = await r.text();
      return new Response(json, { status: r.status, headers: { "content-type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown endpoint" }), { status: 404, headers: { "content-type": "application/json" } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "content-type": "application/json" } });
  }
});
