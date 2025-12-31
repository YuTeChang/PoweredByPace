import { NextRequest, NextResponse } from 'next/server';
import { GroupService } from '@/lib/services/groupService';

// GET /api/groups/shareable/[link] - Get a group by shareable link
export async function GET(
  request: NextRequest,
  { params }: { params: { link: string } }
) {
  try {
    const shareableLink = params.link;
    const group = await GroupService.getGroupByShareableLink(shareableLink);

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error('[API] Error fetching group by link:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    );
  }
}


