import { NextResponse } from 'next/server';
import { runFullSync, runQuickSync, getSyncStatus } from '@/lib/scrapers/sync';
import { syncOddsToDatabase } from '@/lib/scrapers/odds-api';

export async function GET() {
  try {
    const status = await getSyncStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error getting sync status:', error);
    return NextResponse.json({ error: 'Failed to get sync status' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Verify cron secret for security (optional)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'quick';

  try {
    switch (type) {
      case 'full':
        // Full sync - run in background, takes 30+ minutes
        runFullSync().catch(console.error);
        return NextResponse.json({
          message: 'Full sync started in background',
          estimatedTime: '30-60 minutes',
          status: 'started',
        });

      case 'quick':
        const quickResult = await runQuickSync();
        return NextResponse.json({
          message: 'Quick sync complete',
          status: 'completed',
          result: quickResult,
        });

      case 'odds':
        const oddsResult = await syncOddsToDatabase();
        return NextResponse.json({
          message: 'Odds sync complete',
          status: 'completed',
          result: oddsResult,
        });

      default:
        return NextResponse.json({ error: 'Invalid sync type. Use: full, quick, or odds' }, { status: 400 });
    }
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({
      error: 'Sync failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
