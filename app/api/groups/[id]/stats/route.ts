import { NextRequest, NextResponse } from 'next/server';
import { StatsService } from '@/lib/services/statsService';

// GET /api/groups/[id]/stats - Get leaderboard data for a group
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id;
    
    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    const leaderboard = await StatsService.getLeaderboard(groupId);

    // Add caching headers
    const response = NextResponse.json(leaderboard);
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=10, stale-while-revalidate=30'
    );
    
    return response;
  } catch (error) {
    console.error('[API] Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

