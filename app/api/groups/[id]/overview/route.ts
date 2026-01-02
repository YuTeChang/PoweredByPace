import { NextResponse } from 'next/server';
import { GroupService } from '@/lib/services/groupService';

// Force dynamic rendering - prevent caching stale stats
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/groups/[id]/overview
 * Get group overview statistics (total games, sessions, most active player, closest matchup)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;

    const stats = await GroupService.getGroupStats(groupId);

    // No caching for overview stats - they should always be fresh
    const response = NextResponse.json(stats);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (error) {
    console.error('[API] Error fetching group overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group overview' },
      { status: 500 }
    );
  }
}
