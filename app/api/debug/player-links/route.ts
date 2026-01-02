import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

// GET /api/debug/player-links?groupId=xxx - Check player linking status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json({ error: 'groupId required' }, { status: 400 });
    }

    const supabase = createSupabaseClient();

    // 1. Get all group players (including inactive for debugging)
    const { data: groupPlayers } = await supabase
      .from('group_players')
      .select('id, name, elo_rating, wins, losses, total_games, is_active')
      .eq('group_id', groupId);

    // 2. Get all sessions for this group
    const { data: sessions } = await supabase
      .from('sessions')
      .select('id, name')
      .eq('group_id', groupId);

    const sessionIds = (sessions || []).map(s => s.id);

    // 3. Get all session players and their group_player_id links
    const { data: sessionPlayers } = await supabase
      .from('players')
      .select('id, name, session_id, group_player_id')
      .in('session_id', sessionIds.length > 0 ? sessionIds : ['__none__']);

    // 4. Get all games
    const { data: games } = await supabase
      .from('games')
      .select('id, session_id, team_a, team_b, winning_team, created_at')
      .in('session_id', sessionIds.length > 0 ? sessionIds : ['__none__'])
      .not('winning_team', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20);

    // Analyze linking
    const unlinkedPlayers = (sessionPlayers || []).filter(p => !p.group_player_id);
    const linkedPlayers = (sessionPlayers || []).filter(p => p.group_player_id);

    // Build mapping for analysis
    const sessionPlayerMap = new Map((sessionPlayers || []).map(p => [p.id, p]));
    const groupPlayerMap = new Map((groupPlayers || []).map(p => [p.id, p]));

    // Analyze games to see which players participated
    const gameAnalysis = (games || []).map(game => {
      const teamA = Array.isArray(game.team_a) ? game.team_a : JSON.parse(game.team_a || '[]');
      const teamB = Array.isArray(game.team_b) ? game.team_b : JSON.parse(game.team_b || '[]');
      
      const teamADetails = teamA.map((id: string) => {
        const sp = sessionPlayerMap.get(id);
        const gp = sp?.group_player_id ? groupPlayerMap.get(sp.group_player_id) : null;
        return {
          sessionPlayerId: id,
          name: sp?.name || 'Unknown',
          groupPlayerId: sp?.group_player_id || null,
          groupPlayerName: gp?.name || null,
          linked: !!sp?.group_player_id,
        };
      });

      const teamBDetails = teamB.map((id: string) => {
        const sp = sessionPlayerMap.get(id);
        const gp = sp?.group_player_id ? groupPlayerMap.get(sp.group_player_id) : null;
        return {
          sessionPlayerId: id,
          name: sp?.name || 'Unknown',
          groupPlayerId: sp?.group_player_id || null,
          groupPlayerName: gp?.name || null,
          linked: !!sp?.group_player_id,
        };
      });

      return {
        gameId: game.id,
        winningTeam: game.winning_team,
        createdAt: game.created_at,
        teamA: teamADetails,
        teamB: teamBDetails,
        allLinked: [...teamADetails, ...teamBDetails].every(p => p.linked),
      };
    });

    return NextResponse.json({
      groupId,
      summary: {
        totalGroupPlayers: groupPlayers?.length || 0,
        activeGroupPlayers: groupPlayers?.filter(p => p.is_active !== false).length || 0,
        inactiveGroupPlayers: groupPlayers?.filter(p => p.is_active === false).length || 0,
        totalSessions: sessions?.length || 0,
        totalSessionPlayers: sessionPlayers?.length || 0,
        linkedPlayers: linkedPlayers.length,
        unlinkedPlayers: unlinkedPlayers.length,
        totalGames: games?.length || 0,
      },
      groupPlayers: groupPlayers?.map(gp => ({
        id: gp.id,
        name: gp.name,
        isActive: gp.is_active ?? true,
        storedStats: { wins: gp.wins, losses: gp.losses, total_games: gp.total_games, elo_rating: gp.elo_rating },
      })),
      unlinkedSessionPlayers: unlinkedPlayers.map(p => ({
        id: p.id,
        name: p.name,
        sessionId: p.session_id,
      })),
      recentGames: gameAnalysis,
    });
  } catch (error) {
    console.error('[Debug] Error:', error);
    return NextResponse.json({ error: 'Failed to analyze' }, { status: 500 });
  }
}
