import { createSupabaseClient } from '@/lib/supabase';
import { Game, Player } from '@/types';

export interface GroupPlayerStats {
  groupPlayerId: string;
  playerName: string;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  pointsScored: number;
  pointsConceded: number;
  sessionsPlayed: number;
}

/**
 * Service layer for aggregating player stats across sessions
 */
export class StatsService {
  /**
   * Get aggregated stats for all players in a group
   */
  static async getGroupPlayersStats(groupId: string): Promise<GroupPlayerStats[]> {
    try {
      const supabase = createSupabaseClient();
      
      // Get all group players
      const { data: groupPlayers, error: gpError } = await supabase
        .from('group_players')
        .select('id, name')
        .eq('group_id', groupId);

      if (gpError) {
        throw gpError;
      }

      if (!groupPlayers || groupPlayers.length === 0) {
        return [];
      }

      // Get all sessions in the group
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('id')
        .eq('group_id', groupId);

      if (sessionsError) {
        throw sessionsError;
      }

      if (!sessions || sessions.length === 0) {
        return groupPlayers.map((gp) => ({
          groupPlayerId: gp.id,
          playerName: gp.name,
          totalGames: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          pointsScored: 0,
          pointsConceded: 0,
          sessionsPlayed: 0,
        }));
      }

      const sessionIds = sessions.map((s) => s.id);

      // Get all games from these sessions
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('*')
        .in('session_id', sessionIds)
        .not('winning_team', 'is', null);

      if (gamesError) {
        throw gamesError;
      }

      // Get all players from these sessions (to map session player IDs to group player IDs)
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id, session_id, group_player_id')
        .in('session_id', sessionIds)
        .not('group_player_id', 'is', null);

      if (playersError) {
        throw playersError;
      }

      // Create a map of session player ID to group player ID
      const playerToGroupPlayer = new Map<string, string>();
      const groupPlayerSessions = new Map<string, Set<string>>();
      
      (players || []).forEach((p) => {
        if (p.group_player_id) {
          playerToGroupPlayer.set(p.id, p.group_player_id);
          
          if (!groupPlayerSessions.has(p.group_player_id)) {
            groupPlayerSessions.set(p.group_player_id, new Set());
          }
          groupPlayerSessions.get(p.group_player_id)!.add(p.session_id);
        }
      });

      // Calculate stats for each group player
      const statsMap = new Map<string, GroupPlayerStats>();
      
      groupPlayers.forEach((gp) => {
        statsMap.set(gp.id, {
          groupPlayerId: gp.id,
          playerName: gp.name,
          totalGames: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          pointsScored: 0,
          pointsConceded: 0,
          sessionsPlayed: groupPlayerSessions.get(gp.id)?.size || 0,
        });
      });

      // Process each game
      (games || []).forEach((game) => {
        const teamA = this.parseJsonArray(game.team_a);
        const teamB = this.parseJsonArray(game.team_b);
        const winningTeam = game.winning_team;
        const teamAScore = game.team_a_score || 0;
        const teamBScore = game.team_b_score || 0;

        // Process team A players
        teamA.forEach((playerId: string) => {
          const groupPlayerId = playerToGroupPlayer.get(playerId);
          if (groupPlayerId && statsMap.has(groupPlayerId)) {
            const stats = statsMap.get(groupPlayerId)!;
            stats.totalGames += 1;
            if (winningTeam === 'A') {
              stats.wins += 1;
              stats.pointsScored += teamAScore;
              stats.pointsConceded += teamBScore;
            } else {
              stats.losses += 1;
              stats.pointsScored += teamAScore;
              stats.pointsConceded += teamBScore;
            }
          }
        });

        // Process team B players
        teamB.forEach((playerId: string) => {
          const groupPlayerId = playerToGroupPlayer.get(playerId);
          if (groupPlayerId && statsMap.has(groupPlayerId)) {
            const stats = statsMap.get(groupPlayerId)!;
            stats.totalGames += 1;
            if (winningTeam === 'B') {
              stats.wins += 1;
              stats.pointsScored += teamBScore;
              stats.pointsConceded += teamAScore;
            } else {
              stats.losses += 1;
              stats.pointsScored += teamBScore;
              stats.pointsConceded += teamAScore;
            }
          }
        });
      });

      // Calculate win rates
      const results = Array.from(statsMap.values()).map((stats) => ({
        ...stats,
        winRate: stats.totalGames > 0 ? (stats.wins / stats.totalGames) * 100 : 0,
      }));

      // Sort by win rate, then by total games
      return results.sort((a, b) => {
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        return b.totalGames - a.totalGames;
      });
    } catch (error) {
      console.error('[StatsService] Error fetching group player stats:', error);
      throw new Error('Failed to fetch group player stats');
    }
  }

  /**
   * Get stats for a specific group player
   */
  static async getGroupPlayerStats(groupId: string, groupPlayerId: string): Promise<GroupPlayerStats | null> {
    const allStats = await this.getGroupPlayersStats(groupId);
    return allStats.find((s) => s.groupPlayerId === groupPlayerId) || null;
  }

  /**
   * Parse JSON array from database (handles both string and array formats)
   */
  private static parseJsonArray(value: unknown): string[] {
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
    return value as string[];
  }
}


