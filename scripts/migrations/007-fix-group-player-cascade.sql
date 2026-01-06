-- Migration: Fix foreign key constraint to allow group deletion
-- Version: 007
-- Description: Add ON DELETE CASCADE to players.group_player_id foreign key
--              This allows groups to be deleted without constraint violations

-- Drop the existing constraint
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_group_player_id_fkey;

-- Re-add the constraint with ON DELETE SET NULL
-- We use SET NULL instead of CASCADE because:
-- 1. Session players should remain even if the group player is deleted
-- 2. This preserves historical game data
-- 3. The session itself will be deleted via sessions.group_id CASCADE
ALTER TABLE players ADD CONSTRAINT players_group_player_id_fkey 
  FOREIGN KEY (group_player_id) REFERENCES group_players(id) ON DELETE SET NULL;

-- Note: When a group is deleted:
-- 1. groups CASCADE deletes → group_players
-- 2. group_players SET NULL → players.group_player_id (keeps player record)
-- 3. groups CASCADE deletes → sessions (via sessions.group_id)
-- 4. sessions CASCADE deletes → players (via players.session_id)
-- 5. sessions CASCADE deletes → games (via games.session_id)
--
-- Result: All group data is properly cleaned up

