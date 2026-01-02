-- Migration: Add soft-delete support for group_players
-- This allows players to be "removed" while preserving their historical data and stats
-- When a player is re-added with the same name, they are reactivated instead of creating a new record

-- Add is_active column to group_players (default true for existing records)
ALTER TABLE group_players ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Create index for efficient filtering of active players
CREATE INDEX IF NOT EXISTS idx_group_players_active ON group_players(group_id, is_active);

-- Note: Existing queries should be updated to filter by is_active = true
-- when listing players, but should NOT filter when looking up player names
-- for historical stats (to preserve names for past games)
