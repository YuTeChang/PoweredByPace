import { NextRequest, NextResponse } from 'next/server';
import { GroupService } from '@/lib/services/groupService';

// GET /api/groups - Get all groups
export async function GET() {
  try {
    const groups = await GroupService.getAllGroups();
    return NextResponse.json(groups);
  } catch (error) {
    console.error('[API] Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

// POST /api/groups - Create a new group
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      );
    }

    const group = await GroupService.createGroup(name);
    return NextResponse.json({ success: true, group });
  } catch (error) {
    console.error('[API] Error creating group:', error);
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    );
  }
}


