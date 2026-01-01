import { createSupabaseClient } from '@/lib/supabase';
import { Game } from '@/types';
import { EloService } from './eloService';

export interface GameRow {
  id: string;
  session_id: string;
  game_number: number;
  team_a: unknown; // jsonb can come back as object or string
  team_b: unknown; // jsonb can come back as object or string
  winning_team: string | null;
  team_a_score: number | null;
  team_b_score: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Service layer for game database operations
 */
export class GameService {
  /**
   * Get all games for a session
   */
  static async getGamesBySessionId(sessionId: string): Promise<Game[]> {
    try {
      const supabase = createSupabaseClient();
      
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select('*')
        .eq('session_id', sessionId)
        .order('game_number', { ascending: true });

      if (gamesError) {
        throw gamesError;
      }

      return (gamesData || []).map((row) => this.mapRowToGame(row as any));
    } catch (error) {
      console.error('[GameService] Error fetching games:', error);
      throw new Error('Failed to fetch games');
    }
  }

  /**
   * Create a new game
   */
  static async createGame(
    sessionId: string,
    game: Omit<Game, 'id' | 'sessionId' | 'gameNumber'>,
    gameNumber?: number
  ): Promise<Game> {
    try {
      const supabase = createSupabaseClient();
      
      // Get current max game number if not provided
      let nextGameNumber = gameNumber;
      if (!nextGameNumber) {
        const { data: maxData, error: maxError } = await supabase
          .from('games')
          .select('game_number')
          .eq('session_id', sessionId)
          .order('game_number', { ascending: false })
          .limit(1)
          .single();

        if (maxError && maxError.code !== 'PGRST116') {
          // PGRST116 is "no rows returned", which is fine
          throw maxError;
        }

        nextGameNumber = (maxData?.game_number || 0) + 1;
      }

      const gameId = `${sessionId}-game-${nextGameNumber}`;

      const { data: insertedGame, error: insertError } = await supabase
        .from('games')
        .insert({
          id: gameId,
          session_id: sessionId,
          game_number: nextGameNumber,
          team_a: game.teamA,
          team_b: game.teamB,
          winning_team: game.winningTeam || null,
          team_a_score: game.teamAScore || null,
          team_b_score: game.teamBScore || null,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      const createdGame = this.mapRowToGame(insertedGame as any);

      // Update ELO if game has a winner
      if (game.winningTeam) {
        await this.updateEloForGame(sessionId, createdGame);
      }

      return createdGame;
    } catch (error) {
      console.error('[GameService] Error creating game:', error);
      throw new Error('Failed to create game');
    }
  }

  /**
   * Create multiple games in batch (upsert to handle duplicates)
   */
  static async createGames(
    sessionId: string,
    games: Omit<Game, 'id' | 'sessionId' | 'gameNumber'>[]
  ): Promise<Game[]> {
    try {
      const supabase = createSupabaseClient();
      
      const gamesData = games.map((game, i) => {
        const gameNumber = i + 1;
        const gameId = `${sessionId}-game-${gameNumber}`;
        return {
          id: gameId,
          session_id: sessionId,
          game_number: gameNumber,
          team_a: game.teamA,
          team_b: game.teamB,
          winning_team: game.winningTeam || null,
          team_a_score: game.teamAScore || null,
          team_b_score: game.teamBScore || null,
        };
      });

      const { data: insertedGames, error: insertError } = await supabase
        .from('games')
        .upsert(gamesData, {
          onConflict: 'id',
        })
        .select();

      if (insertError) {
        throw insertError;
      }

      const createdGames = (insertedGames || []).map((row) => this.mapRowToGame(row as any));

      // Update ELO for games with winners
      for (const game of createdGames) {
        if (game.winningTeam) {
          await this.updateEloForGame(sessionId, game);
        }
      }

      return createdGames;
    } catch (error) {
      console.error('[GameService] Error creating games:', error);
      throw new Error('Failed to create games');
    }
  }

  /**
   * Update a game
   */
  static async updateGame(
    sessionId: string,
    gameId: string,
    updates: Partial<Game>
  ): Promise<Game> {
    try {
      const supabase = createSupabaseClient();
      
      // First, get the current game state to check if winning_team is changing
      const { data: currentGame, error: fetchError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .eq('session_id', sessionId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const previousWinningTeam = currentGame?.winning_team;
      
      const updateData: any = {};
      
      if (updates.teamA !== undefined) {
        updateData.team_a = updates.teamA;
      }
      if (updates.teamB !== undefined) {
        updateData.team_b = updates.teamB;
      }
      if (updates.winningTeam !== undefined) {
        updateData.winning_team = updates.winningTeam;
      }
      if (updates.teamAScore !== undefined) {
        updateData.team_a_score = updates.teamAScore;
      }
      if (updates.teamBScore !== undefined) {
        updateData.team_b_score = updates.teamBScore;
      }

      if (Object.keys(updateData).length === 0) {
        throw new Error('No fields to update');
      }

      const { data: updatedGame, error: updateError } = await supabase
        .from('games')
        .update(updateData)
        .eq('id', gameId)
        .eq('session_id', sessionId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      const game = this.mapRowToGame(updatedGame as any);

      // Update ELO if winning team is being set for the first time
      // (only when going from null to a value, not when changing existing result)
      if (updates.winningTeam && !previousWinningTeam) {
        await this.updateEloForGame(sessionId, game);
      }

      return game;
    } catch (error) {
      console.error('[GameService] Error updating game:', error);
      throw new Error('Failed to update game');
    }
  }

  /**
   * Delete a game
   */
  static async deleteGame(sessionId: string, gameId: string): Promise<void> {
    try {
      const supabase = createSupabaseClient();
      
      const { error: deleteError } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId)
        .eq('session_id', sessionId);

      if (deleteError) {
        throw deleteError;
      }
    } catch (error) {
      console.error('[GameService] Error deleting game:', error);
      throw new Error('Failed to delete game');
    }
  }

  /**
   * Update ELO ratings for players in a completed game
   */
  private static async updateEloForGame(sessionId: string, game: Game): Promise<void> {
    try {
      if (!game.winningTeam) return;

      const supabase = createSupabaseClient();

      // Check if this session belongs to a group
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('group_id')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session?.group_id) {
        // Not a group session, no ELO to update
        return;
      }

      // Get player mappings (session player ID -> group player ID)
      const allPlayerIds = [...game.teamA, ...game.teamB];
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id, group_player_id')
        .in('id', allPlayerIds);

      if (playersError || !players) {
        console.error('[GameService] Error fetching player mappings:', playersError);
        return;
      }

      const playerToGroupPlayer = new Map<string, string>();
      players.forEach(p => {
        if (p.group_player_id) {
          playerToGroupPlayer.set(p.id, p.group_player_id);
        }
      });

      // Map team player IDs to group player IDs
      const teamAGroupIds = game.teamA
        .map(id => playerToGroupPlayer.get(id))
        .filter(Boolean) as string[];
      const teamBGroupIds = game.teamB
        .map(id => playerToGroupPlayer.get(id))
        .filter(Boolean) as string[];

      // Update ELO ratings
      if (teamAGroupIds.length > 0 || teamBGroupIds.length > 0) {
        await EloService.processGameResult(teamAGroupIds, teamBGroupIds, game.winningTeam);
      }
    } catch (error) {
      // Log but don't throw - ELO update failure shouldn't fail the game update
      console.error('[GameService] Error updating ELO:', error);
    }
  }

  /**
   * Map database row to Game type
   */
  private static mapRowToGame(row: any): Game {
    const parseJson = <T,>(value: unknown): T => {
      if (typeof value === 'string') {
        return JSON.parse(value) as T;
      }
      return value as T;
    };

    return {
      id: row.id,
      sessionId: row.session_id,
      gameNumber: row.game_number,
      teamA: parseJson<[string, string] | [string]>(row.team_a),
      teamB: parseJson<[string, string] | [string]>(row.team_b),
      winningTeam: row.winning_team as 'A' | 'B' | null,
      teamAScore: row.team_a_score || undefined,
      teamBScore: row.team_b_score || undefined,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    };
  }
}
