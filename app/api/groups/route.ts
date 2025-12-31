import { NextRequest, NextResponse } from 'next/server';
import { GroupService } from '@/lib/services/groupService';
import { createSupabaseClient } from '@/lib/supabase';
import { runMigration } from '@/lib/migration';

// Helper to check if groups table exists
async function checkGroupsTableExists(): Promise<boolean> {
  try {
    const supabase = createSupabaseClient();
    const { error } = await supabase.from('groups').select('id').limit(1);
    
    // Table exists if no error or error is just "no rows" (PGRST116)
    // Table doesn't exist if error indicates missing relation
    return !error || 
      (error.code === 'PGRST116') ||
      (!error.message?.toLowerCase().includes('does not exist') && 
       !error.message?.toLowerCase().includes('relation') &&
       error.code !== '42P01');
  } catch {
    return false;
  }
}

// GET /api/groups - Get all groups
export async function GET() {
  try {
    // Check if groups table exists, auto-migrate if needed
    const tableExists = await checkGroupsTableExists();
    
    if (!tableExists) {
      // Try to run migration automatically
      console.log('[Groups API] Groups table missing, attempting auto-migration...');
      const migrationResult = await runMigration();
      
      if (!migrationResult.success) {
        return NextResponse.json(
          { 
            error: 'Groups table does not exist',
            message: 'Database migration needed',
            autoMigrationAttempted: true,
            autoMigrationResult: migrationResult,
            instructions: [
              'Automatic migration failed. Please run manually:',
              '1. Go to your Supabase project dashboard',
              '2. Navigate to SQL Editor',
              '3. Copy the contents of scripts/migrate-add-groups.sql',
              '4. Paste and run in SQL Editor',
              '5. Refresh this page'
            ]
          },
          { status: 503 }
        );
      }
      
      console.log('[Groups API] Auto-migration successful:', migrationResult.message);
    }
    
    const groups = await GroupService.getAllGroups();
    return NextResponse.json(groups);
  } catch (error: any) {
    console.error('[API] Error fetching groups:', error);
    
    // Check if it's a table missing error
    if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
      return NextResponse.json(
        { 
          error: 'Groups table does not exist',
          message: 'Database migration needed',
          instructions: [
            '1. Go to your Supabase project dashboard',
            '2. Navigate to SQL Editor',
            '3. Copy the contents of scripts/migrate-add-groups.sql',
            '4. Paste and run in SQL Editor',
            '5. Refresh this page'
          ]
        },
        { status: 503 }
      );
    }
    
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

    // Check if groups table exists, auto-migrate if needed
    const tableExists = await checkGroupsTableExists();
    
    if (!tableExists) {
      // Try to run migration automatically
      console.log('[Groups API] Groups table missing, attempting auto-migration...');
      const migrationResult = await runMigration();
      
      if (!migrationResult.success) {
        return NextResponse.json(
          { 
            error: 'Groups table does not exist',
            message: 'Database migration needed',
            autoMigrationAttempted: true,
            autoMigrationResult: migrationResult,
            manualMigration: {
              instructions: [
                'Automatic migration failed. Please run manually:',
                '1. Go to your Supabase project dashboard',
                '2. Navigate to SQL Editor',
                '3. Copy the contents of scripts/migrate-add-groups.sql',
                '4. Paste and run in SQL Editor',
                '5. Try creating the group again'
              ],
              sqlFile: 'scripts/migrate-add-groups.sql'
            }
          },
          { status: 503 }
        );
      }
      
      console.log('[Groups API] Auto-migration successful:', migrationResult.message);
    }

    const group = await GroupService.createGroup(name);
    return NextResponse.json({ success: true, group });
  } catch (error: any) {
    console.error('[API] Error creating group:', error);
    
    // Check if it's a table missing error
    if (error.message?.includes('relation') || error.message?.includes('does not exist') || error.code === 'PGRST116') {
      return NextResponse.json(
        { 
          error: 'Groups table does not exist',
          message: 'Database migration needed',
          instructions: [
            '1. Go to your Supabase project dashboard',
            '2. Navigate to SQL Editor',
            '3. Copy the contents of scripts/migrate-add-groups.sql',
            '4. Paste and run in SQL Editor',
            '5. Try creating the group again'
          ],
          sqlFile: 'scripts/migrate-add-groups.sql'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create group', details: error.message },
      { status: 500 }
    );
  }
}

