import { NextRequest, NextResponse } from 'next/server';
import { GroupService } from '@/lib/services/groupService';

// GET /api/groups/[id]/players - Get all players in a group's pool
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id;
    const players = await GroupService.getGroupPlayers(groupId);
    return NextResponse.json(players);
  } catch (error) {
    console.error('[API] Error fetching group players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group players' },
      { status: 500 }
    );
  }
}

// POST /api/groups/[id]/players - Add a player to a group's pool
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id;
    const body = await request.json();
    const { name, names } = body;

    // Support both single name and multiple names
    if (names && Array.isArray(names)) {
      const players = await GroupService.addGroupPlayers(groupId, names);
      return NextResponse.json({ success: true, players });
    } else if (name && typeof name === 'string') {
      const player = await GroupService.addGroupPlayer(groupId, name);
      return NextResponse.json({ success: true, player });
    } else {
      return NextResponse.json(
        { error: 'Player name is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[API] Error adding group player:', error);
    return NextResponse.json(
      { error: 'Failed to add group player' },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[id]/players - Remove a player from a group's pool
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { playerId } = body;

    if (!playerId) {
      return NextResponse.json(
        { error: 'Player ID is required' },
        { status: 400 }
      );
    }

    await GroupService.removeGroupPlayer(playerId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error removing group player:', error);
    return NextResponse.json(
      { error: 'Failed to remove group player' },
      { status: 500 }
    );
  }
}


