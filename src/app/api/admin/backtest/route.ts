// GET /api/admin/backtest — runs the prediction engine over the historical
// dataset and returns accuracy / calibration / ROI metrics for the /admin view.
import { NextResponse } from 'next/server';
import { runBacktest } from '@/lib/backtest/runner';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const DATA_URL =
  'https://raw.githubusercontent.com/jansen88/ufc-data/master/data/complete_ufc_data.csv';

export async function GET() {
  try {
    const res = await fetch(DATA_URL, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ error: `Failed to fetch dataset (${res.status})` }, { status: 502 });
    }
    const csv = await res.text();
    const result = runBacktest(csv);
    return NextResponse.json({ result, ranAt: new Date().toISOString() });
  } catch (error) {
    console.error('Backtest error:', error);
    return NextResponse.json({ error: 'Backtest failed to run' }, { status: 500 });
  }
}
