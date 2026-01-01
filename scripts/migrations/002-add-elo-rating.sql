-- Migration: Add ELO rating to group_players
-- Run this in Supabase SQL Editor or via psql

-- Add elo_rating column with default value of 1500 (standard starting ELO)
ALTER TABLE group_players ADD COLUMN IF NOT EXISTS elo_rating INTEGER DEFAULT 1500;

-- Create index for faster leaderboard queries (sorting by ELO)
CREATE INDEX IF NOT EXISTS idx_group_players_elo_rating ON group_players(elo_rating DESC);

