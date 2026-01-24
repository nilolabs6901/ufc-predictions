// POST /api/parlay/analyze - Analyze parlay bet
import { NextRequest, NextResponse } from 'next/server';
import { analyzeParlay, ParlayLegInput } from '@/lib/prediction-engine/parlay-analyzer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { legs } = body as { legs: ParlayLegInput[] };

    if (!legs || !Array.isArray(legs)) {
      return NextResponse.json(
        { error: 'Missing legs array in request body' },
        { status: 400 }
      );
    }

    if (legs.length < 2) {
      return NextResponse.json(
        { error: 'Parlay must have at least 2 legs' },
        { status: 400 }
      );
    }

    if (legs.length > 10) {
      return NextResponse.json(
        { error: 'Parlay cannot have more than 10 legs' },
        { status: 400 }
      );
    }

    // Validate each leg
    for (let i = 0; i < legs.length; i++) {
      const leg = legs[i];
      if (!leg.fightId || !leg.selection || typeof leg.modelProb !== 'number') {
        return NextResponse.json(
          { error: `Invalid leg at index ${i}: missing required fields` },
          { status: 400 }
        );
      }
    }

    const analysis = analyzeParlay(legs);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Parlay analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze parlay' },
      { status: 500 }
    );
  }
}
