# Brawl Stars integration notes

This branch adds a small Supabase Edge Function proxy and a frontend wrapper to call it.

Files added:
- supabase/functions/brawl-proxy/index.ts  — Edge Function proxy that forwards requests to the Brawl Stars API using an edge secret named BRAWLSTARS_API_TOKEN
- src/integrations/brawlstars.js          — Frontend helper to call the proxy from the web app
- supabase/migrations/20260724_add_imported_players.sql — SQL migration to create imported_players table

Deployment notes (what to do next):
1. In Supabase: Project → Edge Functions → Secrets — add a secret named exactly `BRAWLSTARS_API_TOKEN` with your Brawl Stars API token.
2. In Supabase: Edge Functions → open `brawl-proxy` and Deploy updates. The function must be redeployed after adding the secret.
3. Test the function using the Test/Invoke panel: Method=GET, Query param `tag` = `#PLAYER_TAG`, Role=anon (or add header `Authorization: Bearer <anon public key>`).
4. Run the SQL migration in the SQL editor or via your CI to create the imported_players table.

Once the function is deployed and secrets are set, the frontend helper will call `/functions/v1/brawl-proxy/player?tag=%23TAG` to fetch player data.
