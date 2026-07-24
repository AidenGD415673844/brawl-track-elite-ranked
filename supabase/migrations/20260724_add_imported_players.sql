-- supabase/migrations/20260724_add_imported_players.sql
-- Adds imported_players table used by the Brawl Stars import flow

CREATE TABLE IF NOT EXISTS imported_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  player_tag text,
  player_name text,
  payload jsonb,
  brawlers jsonb,
  teammates jsonb,
  imported_at timestamptz DEFAULT now()
);
