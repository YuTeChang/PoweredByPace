import { NextRequest, NextResponse } from 'next/server';
import { StatsService } from '@/lib/services/statsService';

// GET /api/groups/[id]/players/[playerId]/stats - Get detailed stats for a player
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; playerId: string } }
) {
  try {
    const groupId = params.id;
    const playerId = params.playerId;
    
    if (!groupId || !playerId) {
      return NextResponse.json(
        { error: 'Group ID and Player ID are required' },
        { status: 400 }
      );
    }

    const stats = await StatsService.getPlayerDetailedStats(groupId, playerId);

    if (!stats) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Add caching headers
    const response = NextResponse.json(stats);
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=10, stale-while-revalidate=30'
    );
    
    return response;
  } catch (error) {
    console.error('[API] Error fetching player stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player stats' },
      { status: 500 }
    );
  }
}

