-- Migration: Add win/loss tracking to group_players
-- Run this in Supabase SQL Editor or via psql

-- Add wins column with default value of 0
ALTER TABLE group_players ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0 NOT NULL;

-- Add losses column with default value of 0
ALTER TABLE group_players ADD COLUMN IF NOT EXISTS losses INTEGER DEFAULT 0 NOT NULL;

-- Add total_games column (computed as wins + losses, but stored for convenience)
ALTER TABLE group_players ADD COLUMN IF NOT EXISTS total_games INTEGER DEFAULT 0 NOT NULL;

-- Create index for faster sorting by total games played
CREATE INDEX IF NOT EXISTS idx_group_players_total_games ON group_players(total_games DESC);

-- Create index for faster sorting by wins
CREATE INDEX IF NOT EXISTS idx_group_players_wins ON group_players(wins DESC);

