import { NextResponse } from 'next/server';
import { runMigration } from '@/lib/migration';

/**
 * Automatic database migration endpoint
 * 
 * This endpoint runs the migration SQL automatically using a Postgres connection.
 * 
 * To use this, you need to provide a Postgres connection string in your environment:
 * - POSTGRES_URL or POSTGRES_URL_NON_POOLING (from Supabase dashboard)
 * - VERCEL_POSTGRES_URL (if using Vercel Postgres)
 * 
 * Or you can run migrations manually in Supabase SQL Editor.
 */
export async function POST() {
  try {
    const result = await runMigration();

    if (!result.success) {
      return NextResponse.json({
        ...result,
        instructions: [
          'To enable automatic migrations, add one of these environment variables:',
          '- POSTGRES_URL (from Supabase Settings → Database → Connection string)',
          '- POSTGRES_URL_NON_POOLING (direct connection)',
          '- VERCEL_POSTGRES_URL (if using Vercel Postgres)',
          '',
          'Or run the migration manually:',
          '1. Go to Supabase SQL Editor',
          '2. Copy scripts/migrate-add-groups.sql',
          '3. Paste and run'
        ],
        manualMigration: true
      }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Migrate API] Unexpected error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      errorCode: error.code,
      message: 'Migration failed',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      instructions: [
        'Automatic migration failed. Please run manually:',
        '1. Go to Supabase SQL Editor',
        '2. Copy contents of scripts/migrate-add-groups.sql',
        '3. Paste and run'
      ],
      manualMigration: true
    }, { status: 500 });
  }
}

/**
 * GET endpoint to check migration status
 * Uses direct Postgres query to check if table exists in information_schema
 */
export async function GET() {
  try {
    const connectionString = 
      process.env.POSTGRES_URL || 
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.DATABASE_URL;

    let groupsExists = false;
    let automaticMigrationAvailable = !!connectionString;

    if (connectionString) {
      // Use direct Postgres query to check if table exists
      try {
        const { Pool } = await import('pg');
        // Use SSL for all remote connections (not localhost)
        const isLocalhost = connectionString.includes('localhost') || 
                           connectionString.includes('127.0.0.1');
        const pool = new Pool({
          connectionString,
          ssl: !isLocalhost ? { rejectUnauthorized: false } : undefined,
        });

        try {
          const client = await pool.connect();
          try {
            // Check if groups table exists in information_schema
            const result = await client.query(`
              SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'groups'
              );
            `);
            groupsExists = result.rows[0]?.exists === true;
          } finally {
            client.release();
          }
          await pool.end();
        } catch (pgError: any) {
          console.error('[Migrate] Postgres check error:', pgError);
          // Fall back to Supabase client check
          groupsExists = false;
        }
      } catch (importError) {
        console.error('[Migrate] Failed to import pg:', importError);
        // Fall back to Supabase client check
      }
    }

    // Fallback: Use Supabase client if Postgres check failed
    if (!connectionString || groupsExists === false) {
      try {
        const { createSupabaseClient } = await import('@/lib/supabase');
        const supabase = createSupabaseClient();
        const { error } = await supabase.from('groups').select('id').limit(1);
        
        // Only consider it exists if there's no error or error is just "no rows"
        groupsExists = !error || error.code === 'PGRST116';
      } catch (supabaseError) {
        console.error('[Migrate] Supabase check error:', supabaseError);
        groupsExists = false;
      }
    }
    
    return NextResponse.json({
      migrationNeeded: !groupsExists,
      groupsTableExists: groupsExists,
      automaticMigrationAvailable,
      message: groupsExists 
        ? 'Database is up to date' 
        : automaticMigrationAvailable
          ? 'Migration needed - POST to /api/migrate to run automatically, or run scripts/migrate-add-groups.sql manually'
          : 'Migration needed - run scripts/migrate-add-groups.sql manually in Supabase SQL Editor'
    });
  } catch (error: any) {
    return NextResponse.json({
      migrationNeeded: true,
      groupsTableExists: false,
      error: error.message || 'Unknown error'
    }, { status: 500 });
  }
}
