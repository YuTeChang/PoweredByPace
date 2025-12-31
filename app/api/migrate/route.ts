import { NextResponse } from 'next/server';
import { runMigration } from '@/lib/migration';

/**
 * Internal database migration endpoint
 * 
 * This endpoint runs the migration SQL automatically using a Postgres connection.
 * Migrations run automatically during build (postbuild script) and when needed (e.g., in groups API).
 * 
 * This endpoint is kept for manual triggers if needed, but is not exposed in public UI.
 */
export async function POST() {
  try {
    const result = await runMigration();

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Migrate API] Unexpected error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      errorCode: error.code,
      message: 'Migration failed',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
