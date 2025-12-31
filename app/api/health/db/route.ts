import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Simple DB connectivity check
export async function GET() {
  try {
    const result = await sql<{ ok: number }>`SELECT 1 as ok`;
    const ok = result.rows[0]?.ok === 1;

    const sessionsCountResult = await sql<{ count: string }>`
      SELECT COUNT(*)::text as count FROM sessions
    `;

    return NextResponse.json({
      ok,
      db: 'connected',
      sessionsCount: Number(sessionsCountResult.rows[0]?.count ?? 0),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        db: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
