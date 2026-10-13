import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const start = Date.now();
  let dbStatus = 'healthy';
  let dbLatencyMs = 0;

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('site_settings')
      .select('key')
      .limit(1);

    dbLatencyMs = Date.now() - start;

    if (error) {
      dbStatus = 'degraded';
      return NextResponse.json(
        {
          ok: false,
          version: '0.1.0',
          service: 'keraunous-tech-store',
          database: dbStatus,
          error: error.message,
          dbLatencyMs,
          timestamp: new Date().toISOString(),
        },
        { status: 503 },
      );
    }
  } catch (err) {
    dbStatus = 'unreachable';
    dbLatencyMs = Date.now() - start;
    return NextResponse.json(
      {
        ok: false,
        version: '0.1.0',
        service: 'keraunous-tech-store',
        database: dbStatus,
        error: err instanceof Error ? err.message : String(err),
        dbLatencyMs,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      version: '0.1.0',
      service: 'keraunous-tech-store',
      database: dbStatus,
      dbLatencyMs,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  );
}
